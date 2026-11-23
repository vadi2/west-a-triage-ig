// Copies what the app needs from a built package of this guide into src/fixtures/:
//
//   - the Questionnaire, and the ValueSets and CodeSystems the app reads (questionnaire.json,
//     terminology/), which seed the in-browser store and serve as the conformance copies on a
//     server that does not hold the guide (the public HAPI sandbox);
//   - the guideline (guideline/): the ELM of the CQL Libraries, as the IG Publisher translated
//     it, and the PlanDefinitions and ActivityDefinitions that the browser engine walks the way
//     $apply does.
//
//   node scripts/ig-assets.mjs <package.tgz | unpacked package directory>
//
// The package is the ig-output artifact of a "Build IG" run (output/package.tgz). The files
// are copied as published, without their narrative (and, for the PlanDefinitions and
// ActivityDefinitions, without the contained data requirements); nothing is edited by hand.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const fixtures = path.resolve(here, '../src/fixtures');

const CONFORMANCE = {
  'questionnaire.json': 'Questionnaire-west-a-triage-questionnaire.json',
  'terminology/CodeSystem-west-a-chief-complaint-cs.json': 'CodeSystem-west-a-chief-complaint-cs.json',
  'terminology/CodeSystem-west-a-triage-criterion-cs.json': 'CodeSystem-west-a-triage-criterion-cs.json',
  'terminology/CodeSystem-west-a-triage-priority-cs.json': 'CodeSystem-west-a-triage-priority-cs.json',
  'terminology/ValueSet-west-a-acvpu-vs.json': 'ValueSet-west-a-acvpu-vs.json',
  'terminology/ValueSet-west-a-chief-complaint-vs.json': 'ValueSet-west-a-chief-complaint-vs.json',
  'terminology/ValueSet-west-a-triage-priority-vs.json': 'ValueSet-west-a-triage-priority-vs.json',
};
const LIBRARIES = ['FHIRHelpers', 'WestANEWS2', 'WestATriage'];
const KNOWLEDGE = [
  'PlanDefinition-west-a-triage.json',
  'PlanDefinition-west-a-news2-calculation.json',
  'ActivityDefinition-west-a-record-news2.json',
  'ActivityDefinition-west-a-record-triage-priority.json',
];

function packageDir(input) {
  if (!input) {
    console.error('usage: node scripts/ig-assets.mjs <package.tgz | unpacked package directory>');
    process.exit(2);
  }
  if (fs.statSync(input).isDirectory()) {
    const nested = path.join(input, 'package');
    return fs.existsSync(path.join(nested, 'package.json')) ? nested : input;
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'west-a-package-'));
  execFileSync('tar', ['-xzf', input, '-C', tmp]);
  process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));
  return path.join(tmp, 'package');
}

const dir = packageDir(process.argv[2]);
const read = (file) => {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) {
    console.error(`${file} is not in the package (${dir}): is it a package of this guide?`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};
const write = (file, json) => {
  const p = path.join(fixtures, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(json, null, 1) + '\n');
  console.log(`  ${path.relative(process.cwd(), p)}`);
};
const withoutNarrative = ({ text, ...resource }) => resource;

const pkg = read('package.json');
if (pkg.name !== 'west-a.triage') {
  console.error(`The package is ${pkg.name}, not west-a.triage`);
  process.exit(1);
}
console.log(`${pkg.name}#${pkg.version} (${pkg.date}) → ${path.relative(process.cwd(), fixtures)}`);

for (const [target, source] of Object.entries(CONFORMANCE)) write(target, withoutNarrative(read(source)));

for (const name of LIBRARIES) {
  const library = read(`Library-${name}.json`);
  const content = (library.content ?? []).find((c) => c.contentType === 'application/elm+json');
  if (!content?.data) {
    console.error(`Library-${name}.json has no application/elm+json content: did the IG Publisher translate input/cql/${name}.cql?`);
    process.exit(1);
  }
  const elm = JSON.parse(Buffer.from(content.data, 'base64').toString('utf8'));
  if (elm.library?.identifier?.id !== name) {
    console.error(`The ELM of Library-${name}.json is library ${elm.library?.identifier?.id}`);
    process.exit(1);
  }
  write(`guideline/elm/${name}.json`, elm);
}

for (const file of KNOWLEDGE) {
  const { contained, extension, ...resource } = withoutNarrative(read(file));
  // The only extension is the pointer to the contained data requirements, dropped with them
  const kept = (extension ?? []).filter((e) => e.valueCanonical !== '#effective-data-requirements');
  write(`guideline/${file}`, { ...resource, ...(kept.length ? { extension: kept } : {}) });
}

write('guideline/package.json', { name: pkg.name, version: pkg.version, date: pkg.date, canonical: pkg.canonical });
