// Builds the example Hospital Discharge Report from the examples in this guide's package.
//
//   node demo/lib/make-hdr-example.mjs [package.tgz path or URL] [output.json]
//
// Defaults: the CI build on build.fhir.org, and demo/lib/fixtures/discharge-report.json.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dischargeReport } from './hdr.js';

const here = dirname(fileURLToPath(import.meta.url));
const source = process.argv[2] ?? 'https://build.fhir.org/ig/vadi2/west-a-triage-ig/package.tgz';
const output = process.argv[3] ?? join(here, 'fixtures', 'discharge-report.json');

const WESTA = 'https://vadi2.github.io/west-a-triage-ig/StructureDefinition/';
const VITALS = ['respiratory-rate', 'oxygen-saturation', 'supplemental-oxygen', 'blood-pressure', 'heart-rate',
  'consciousness', 'body-temperature'].map((p) => WESTA + `west-a-${p}`);

const examples = untar(gunzipSync(await load(source)))
  .filter((f) => /^package\/examples?\/[^/]+\.json$/.test(f.name))
  .map((f) => JSON.parse(f.data.toString('utf8')));
if (!examples.length) throw new Error(`no examples in ${source}`);

const withProfile = (url) => examples.filter((r) => r.meta?.profile?.includes(url));
const byReference = (ref) => examples.find((r) => `${r.resourceType}/${r.id}` === ref?.reference);
const one = (list, what) => {
  if (list.length !== 1) throw new Error(`expected one ${what}, found ${list.length}`);
  return list[0];
};

const triage = one(withProfile(WESTA + 'west-a-triage-observation'), 'triage Observation');
// A triage reports the final score; the package also has a preliminary one, from vital signs saved before the triage
const news2 = one(withProfile(WESTA + 'west-a-news2-observation').filter((o) => o.status !== 'preliminary'),
  'final NEWS2 Observation');
const vitals = VITALS.map((url) => one(withProfile(url), url));
const encounter = byReference(triage.encounter);
const patient = byReference(triage.subject);
const author = byReference(triage.performer?.[0]);
for (const [what, r] of Object.entries({ encounter, patient, author })) {
  if (!r) throw new Error(`the triage Observation's ${what} is not among the examples`);
}

const bundle = dischargeReport({
  patient,
  encounter,
  author,
  vitals,
  news2,
  triage,
  dischargeDate: '2026-11-19T15:30:00+01:00',
  dischargeSummary: [
    'Syntetiskt exempel. Bröstsmärta sedan morgonen, triagerad orange (WEST-A, bröstsmärta) med NEWS2 5.',
    'Bedömd av akutläkare. EKG och upprepade troponinprover utan tecken på akut koronart syndrom. '
      + 'Smärtan har gått över. Utskriven till hemmet med uppföljande besök på vårdcentralen.',
  ].join('\n\n'),
  // Fixed, so that the committed example only changes when the inputs or the code change
  date: '2026-11-19T16:00:00+01:00',
  documentId: '1b0c2f9e-6a51-4f43-9a3e-5d1b8e0c7a42',
});

await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(bundle, null, 2) + '\n');
console.log(`wrote ${output}: ${bundle.entry.length} entries`);

async function load(src) {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`${src}: HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(src);
}

// Minimal ustar reader: regular files only, with the GNU long name and pax path extensions
function untar(buf) {
  const files = [];
  let longName = null;
  for (let off = 0; off + 512 <= buf.length;) {
    const header = buf.subarray(off, off + 512);
    if (header.every((b) => b === 0)) break;
    const str = (start, len) => header.subarray(start, start + len).toString('utf8').replace(/\0.*$/s, '');
    const size = parseInt(str(124, 12).trim() || '0', 8);
    const type = str(156, 1);
    const prefix = str(345, 155);
    const data = buf.subarray(off + 512, off + 512 + size);
    let name = longName ?? (prefix ? `${prefix}/${str(0, 100)}` : str(0, 100));
    longName = null;
    if (type === 'L') longName = data.toString('utf8').replace(/\0.*$/s, '');
    else if (type === 'x') longName = /\d+ path=([^\n]*)\n/.exec(data.toString('utf8'))?.[1] ?? null;
    else if (type === '0' || type === '') files.push({ name: name.replace(/^\.\//, ''), data });
    off += 512 + Math.ceil(size / 512) * 512;
  }
  return files;
}
