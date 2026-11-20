// Checks the template-based extraction of the WEST-A Triage Questionnaire on the example
// QuestionnaireResponse of the guide: the 7 vital sign Observations, with the right profiles,
// codes, values, units and references, and no Observation for an unanswered vital sign.
//
//   node extract.test.mjs [IG output directory] [--write <directory>]
//
// The output directory (default ../../output) is the IG Publisher output, or the ig-output
// artifact of the CI. --write saves each extracted Observation as a JSON file, for the FHIR
// validator.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractVitals } from './extract.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const writeAt = args.indexOf('--write');
const writeDir = writeAt >= 0 ? args.splice(writeAt, 2)[1] : null;
const outputDir = args[0] ?? path.join(here, '../../output');

const read = (name) => JSON.parse(fs.readFileSync(path.join(outputDir, `${name}.json`), 'utf8'));
const questionnaire = read('Questionnaire-west-a-triage-questionnaire');
const response = read('QuestionnaireResponse-example-triage-questionnaire-response');

const canonical = 'https://vadi2.github.io/west-a-triage-ig/StructureDefinition/';
const LOINC = 'http://loinc.org';
const SCT = 'http://snomed.info/sct';
const UCUM = 'http://unitsofmeasure.org';
const CATEGORY = 'http://terminology.hl7.org/CodeSystem/observation-category';

// What each profile's Observation must hold for the example response
const expected = {
  'west-a-respiratory-rate': { category: 'vital-signs', loinc: '9279-1', sct: '86290005', value: 22, unit: '/min' },
  'west-a-oxygen-saturation': { category: 'vital-signs', loinc: '2708-6', sct: '431314004', value: 95, unit: '%' },
  'west-a-supplemental-oxygen': { category: 'therapy', sct: '427081008', value: 0, unit: 'L/min' },
  'west-a-blood-pressure': {
    category: 'vital-signs', loinc: '85354-9', sct: '75367002',
    components: [['8480-6', '271649006', 105], ['8462-4', '271650006', 70]],
  },
  'west-a-heart-rate': { category: 'vital-signs', loinc: '8867-4', sct: '364075005', value: 95, unit: '/min' },
  'west-a-consciousness': { category: 'exam', sct: '1104441000000107', coded: '248234008' },
  'west-a-body-temperature': { category: 'vital-signs', loinc: '8310-5', sct: '386725007', value: 37.5, unit: 'Cel' },
};

const hasCoding = (concept, system, code) => concept?.coding?.some((c) => c.system === system && c.code === code);

function checkQuantity(quantity, value, unit, where) {
  assert.equal(quantity?.value, value, `${where}: value`);
  assert.equal(quantity?.system, UCUM, `${where}: UCUM system`);
  assert.equal(quantity?.code, unit, `${where}: UCUM code`);
}

function checkObservation(observation, profile) {
  const want = expected[profile];
  assert.deepEqual(observation.meta?.profile, [canonical + profile], `${profile}: meta.profile`);
  assert.equal(observation._meta, undefined, `${profile}: no leftover extension properties`);
  assert.equal(observation.status, 'final', `${profile}: status`);
  assert.ok(observation.category?.some((c) => hasCoding(c, CATEGORY, want.category)), `${profile}: category ${want.category}`);
  if (want.loinc) assert.ok(hasCoding(observation.code, LOINC, want.loinc), `${profile}: LOINC ${want.loinc}`);
  assert.ok(hasCoding(observation.code, SCT, want.sct), `${profile}: SNOMED CT ${want.sct}`);
  assert.deepEqual(observation.subject, response.subject, `${profile}: subject`);
  assert.deepEqual(observation.encounter, response.encounter, `${profile}: encounter`);
  assert.deepEqual(observation.performer, [response.author], `${profile}: performer`);
  assert.equal(observation.effectiveDateTime, response.authored, `${profile}: effectiveDateTime`);
  if (want.unit) checkQuantity(observation.valueQuantity, want.value, want.unit, profile);
  if (want.coded) assert.ok(hasCoding(observation.valueCodeableConcept, SCT, want.coded), `${profile}: value ${want.coded}`);
  for (const [i, [loinc, sct, value]] of (want.components ?? []).entries()) {
    const component = observation.component?.[i];
    assert.ok(hasCoding(component?.code, LOINC, loinc) && hasCoding(component?.code, SCT, sct), `${profile}: component ${loinc}`);
    checkQuantity(component.valueQuantity, value, 'mm[Hg]', `${profile} component ${loinc}`);
  }
  const extensions = JSON.stringify(observation).match(/sdc-questionnaire-template\w+/g);
  assert.equal(extensions, null, `${profile}: template extensions left in the Observation`);
}

const profileOf = (entry) => entry.resource.meta?.profile?.[0]?.replace(canonical, '');

// 1. The example response gives all 7 Observations
const bundle = await extractVitals(questionnaire, response);
assert.equal(bundle.resourceType, 'Bundle');
assert.equal(bundle.type, 'transaction');
assert.deepEqual(bundle.entry.map(profileOf).sort(), Object.keys(expected).sort(), 'one Observation per WEST-A vital sign profile');
for (const entry of bundle.entry) {
  assert.match(entry.fullUrl, /^urn:uuid:/);
  assert.deepEqual(entry.request, { method: 'POST', url: 'Observation' });
  checkObservation(entry.resource, profileOf(entry));
}
console.log(`ok - the example response gives the ${bundle.entry.length} vital sign Observations`);

// 2. Unanswered vital signs give no Observation, whether the item is left out or left empty
const partial = structuredClone(response);
const vitals = partial.item.find((item) => item.linkId === 'vitals');
vitals.item = vitals.item.filter((item) => item.linkId !== 'oxygen-flow');
delete vitals.item.find((item) => item.linkId === 'temperature').answer;
const partialBundle = await extractVitals(questionnaire, partial);
assert.deepEqual(
  partialBundle.entry.map(profileOf).sort(),
  Object.keys(expected).filter((p) => p !== 'west-a-supplemental-oxygen' && p !== 'west-a-body-temperature').sort(),
  'no Observation for the unanswered oxygen flow and temperature',
);
assert.deepEqual(response.item.find((item) => item.linkId === 'vitals').item.length, 8, 'the input response is not changed');
console.log('ok - unanswered vital signs give no Observation');

if (writeDir) {
  fs.mkdirSync(writeDir, { recursive: true });
  for (const entry of bundle.entry) {
    fs.writeFileSync(path.join(writeDir, `${profileOf(entry)}.json`), JSON.stringify(entry.resource, null, 2) + '\n');
  }
  console.log(`wrote the ${bundle.entry.length} Observations to ${writeDir}`);
}
