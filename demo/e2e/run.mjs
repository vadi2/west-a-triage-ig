#!/usr/bin/env node
// Headless end-to-end run of the WEST-A triage demo against a FHIR server with clinical
// reasoning (HAPI FHIR, R4), as the app does it:
//
//   1. record the vital signs of the example patient at her emergency department visit:
//      extracted from a QuestionnaireResponse with demo/lib/extract.js when that module
//      exists, else copies of the guide's example vital signs, both with the time of now;
//   2. run the guideline (demo/lib/cds.js runTriage) and check NEWS2 and the proposed
//      priority for several assessments of the chief complaint;
//   3. record the NEWS2 and triage Observations, and write them to the output folder for
//      validation against their profiles;
//   4. for a new patient, record only some of the vital signs, check the provisional NEWS2
//      and priority, and record a preliminary NEWS2, also written for validation.
//
//   node demo/e2e/run.mjs [--base http://localhost:8080/fhir] [--out demo/e2e/output] [--load [package.tgz|url]]
//
// Exits non-zero on any mismatch.

import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fhir, runTriage, news2Observation, triageObservation, priorityCoding, CHIEF_COMPLAINT_SYSTEM } from '../lib/cds.js';

const here = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { base: process.env.FHIR_BASE || 'http://localhost:8080/fhir', out: join(here, 'output'), load: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base') args.base = argv[++i];
    else if (a === '--out') args.out = resolve(argv[++i]);
    else if (a === '--load') args.load = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '';
    else throw new Error(`Unknown argument ${a}`);
  }
  return args;
}

const PATIENT = 'example-patient-personnummer';
const ENCOUNTER = 'example-encounter-emergency';
const PRACTITIONER = 'example-practitioner-triage-nurse';
const SCT = 'http://snomed.info/sct';
const SCT_SE = 'http://snomed.info/sct/45991000052106';

// The example vital signs: NEWS2 5 (2+1+0+1+1+0+0), medium clinical risk, orange
const EXAMPLE_VITALS = [
  'example-respiratory-rate', 'example-oxygen-saturation', 'example-supplemental-oxygen',
  'example-blood-pressure', 'example-heart-rate', 'example-consciousness', 'example-body-temperature',
];
const EXPECTED_NEWS2 = {
  total: 5,
  risk: 'medium',
  scores: {
    'Respiration Rate Score': 2,
    'Oxygen Saturation Scale 1 Score': 1,
    'Supplemental Oxygen Score': 0,
    'Systolic Blood Pressure Score': 1,
    'Pulse Score': 1,
    'Consciousness Score': 0,
    'Temperature Score': 0,
  },
};

// The answers of the triage form that give the example vital signs (README, Questionnaire contract)
const ANSWERS = {
  'respiratory-rate': { valueInteger: 22 },
  'oxygen-saturation': { valueInteger: 95 },
  'oxygen-flow': { valueDecimal: 0 },
  systolic: { valueInteger: 105 },
  diastolic: { valueInteger: 70 },
  'heart-rate': { valueInteger: 95 },
  consciousness: { valueCoding: { system: SCT, version: SCT_SE, code: '248234008', display: 'psykiskt klar' } },
  temperature: { valueDecimal: 37.5 },
  'chief-complaint': { valueCoding: { system: CHIEF_COMPLAINT_SYSTEM, code: '4', display: 'Bröstsmärta' } },
  'uncoded-warning-symptom': { valueBoolean: true },
  'uncoded-warning-symptom-text': { valueString: 'Bröstsmärta sedan en vecka, nu besvärsfri' },
  'complaint-priority': { valueCoding: priorityCoding('4') },
  'oxygen-scale-2': { valueBoolean: false },
};

const failures = [];
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}: ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`);
  if (!ok) failures.push(label);
}

const idOf = (location) => /Observation\/([^/]+)/.exec(location ?? '')?.[1];

async function loadExtract() {
  const path = join(here, '..', 'lib', 'extract.js');
  try { await access(path); } catch { return null; }
  return import(pathToFileURL(path).href);
}

// A QuestionnaireResponse that mirrors the Questionnaire's items, answered from ANSWERS
function questionnaireResponse(questionnaire, now) {
  const items = (qItems = []) => qItems.flatMap((q) => {
    if (q.type === 'group' || q.type === 'display') {
      const children = q.type === 'group' ? items(q.item) : [];
      return children.length ? [{ linkId: q.linkId, ...(q.text ? { text: q.text } : {}), item: children }] : [];
    }
    const answer = ANSWERS[q.linkId];
    return answer ? [{ linkId: q.linkId, ...(q.text ? { text: q.text } : {}), answer: [answer] }] : [];
  });
  return {
    resourceType: 'QuestionnaireResponse',
    questionnaire: questionnaire.version ? `${questionnaire.url}|${questionnaire.version}` : questionnaire.url,
    status: 'completed',
    subject: { reference: `Patient/${PATIENT}` },
    encounter: { reference: `Encounter/${ENCOUNTER}` },
    author: { reference: `Practitioner/${PRACTITIONER}` },
    authored: now,
    item: items(questionnaire.item),
  };
}

// Record the vital signs; the ids of the created Observations
async function recordVitals(client, now) {
  const extract = await loadExtract();
  let bundle;
  if (extract?.extractVitals) {
    const found = await client.search('Questionnaire', { _id: 'west-a-triage-questionnaire' });
    const questionnaire = found.entry?.[0]?.resource;
    if (!questionnaire) throw new Error('demo/lib/extract.js exists, but the server has no Questionnaire/west-a-triage-questionnaire: load the package first');
    const qr = questionnaireResponse(questionnaire, now);
    bundle = await extract.extractVitals(questionnaire, qr);
    console.log(`Extracted ${bundle.entry?.length ?? 0} vital signs with demo/lib/extract.js`);
  } else {
    console.log('No demo/lib/extract.js: recording copies of the example vital signs');
    const entry = [];
    for (const id of EXAMPLE_VITALS) {
      const { id: _id, meta, text, ...observation } = await client.read('Observation', id);
      entry.push({
        resource: { ...observation, ...(meta?.profile ? { meta: { profile: meta.profile } } : {}), effectiveDateTime: now },
        request: { method: 'POST', url: 'Observation' },
      });
    }
    bundle = { resourceType: 'Bundle', type: 'transaction', entry };
  }
  const response = await client.transaction(bundle);
  const ids = response.entry.map((e) => idOf(e.response?.location)).filter(Boolean);
  check('vital sign Observations recorded', ids.length, 7);
  return ids;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const client = fhir(args.base);
  if (args.load !== null) {
    const { loadPackage } = await import('../hapi/load.mjs');
    await loadPackage(args.load || undefined, client.base);
  }
  await mkdir(args.out, { recursive: true });

  // The current time, to the second, after the example vital signs
  const now = new Date(Math.max(Date.now(), Date.parse('2026-11-19T08:39:00+01:00'))).toISOString().replace(/\.\d+Z$/, 'Z');
  const vitalIds = await recordVitals(client, now);

  const context = { patientId: PATIENT, encounterId: ENCOUNTER, practitionerId: PRACTITIONER };
  const t0 = Date.now();
  const green = await runTriage(client, { ...context, complaintPriority: '4' });
  console.log(`runTriage: ${Date.now() - t0} ms`);
  check('NEWS2 total', green.news2.total, EXPECTED_NEWS2.total);
  check('NEWS2 clinical risk', green.news2.risk, EXPECTED_NEWS2.risk);
  check('NEWS2 scores', green.news2.scores, EXPECTED_NEWS2.scores);
  check('NEWS2 derived from the recorded vital signs',
    green.news2.derivedFrom.map((r) => r.reference).sort(), vitalIds.map((id) => `Observation/${id}`).sort());
  check('priority from the vital parameters', green.vitalParameterPriority?.code, '2');
  check('complaint priority 4 (Grön): proposed', green.proposedPriority?.code, '2');
  check('task descriptions', green.summaries, ['NEWS2 5, clinical risk medium', 'Proposed WEST-A priority: Orange']);
  check('all measured: the provisional result is the final one',
    [green.provisional.total, green.provisional.risk, green.provisional.missing, green.provisional.priority?.code], [5, 'medium', [], '2']);

  const red = await runTriage(client, { ...context, complaintPriority: '1' });
  check('complaint priority 1 (Röd): proposed', red.proposedPriority?.code, '1');
  check('complaint priority 1 (Röd): display', red.proposedPriority?.display, 'Röd');

  const yellow = await runTriage(client, { ...context, complaintPriority: '4', yellowAsLowest: true });
  check('complaint priority 4, yellow as lowest: proposed', yellow.proposedPriority?.code, '2');

  const unassessed = await runTriage(client, { ...context, complaintPriority: null });
  check('warning symptoms not assessed: nothing proposed', unassessed.proposedPriority, null);

  const scale2 = await runTriage(client, { ...context, complaintPriority: '4', scale2: true });
  check('scale 2: SpO2 95% on air scores 0, total 4, low', [scale2.news2.scores['Oxygen Saturation Scale 2 Score'], scale2.news2.total, scale2.news2.risk], [0, 4, 'low']);
  check('scale 2: proposed', scale2.proposedPriority?.code, '4');

  // Warning symptoms (triage criteria) set the complaint priority. A single
  // criterion is checked on its own: HAPI drops a list parameter sent once.
  const proposedFor = async (triageCriteria, extra = {}) =>
    (await runTriage(client, { ...context, triageCriteria, ...extra })).proposedPriority?.code ?? null;
  check('criterion 15 (orange) alone: proposed', await proposedFor(['15']), '2');
  check('criterion 74 (red) alone: proposed', await proposedFor(['74']), '1');
  check('no warning symptoms (163), scale 2: proposed', await proposedFor(['163'], { scale2: true }), '4');
  check('no warning symptoms and a need (159), scale 2: proposed', await proposedFor(['163', '159'], { scale2: true }), '3');
  check('a need alone (159): nothing proposed', await proposedFor(['159'], { scale2: true }), null);

  // The nurse confirms the proposed priority and records NEWS2 and the triage
  const news2 = await client.create(news2Observation({
    news2: green.news2, patientId: PATIENT, encounterId: ENCOUNTER, performerId: PRACTITIONER, effectiveDateTime: now,
  }));
  check('NEWS2 Observation recorded, derived from the 7 vital signs', news2.derivedFrom?.length, 7);
  const triage = await client.create(triageObservation({
    priority: green.proposedPriority,
    proposedPriority: green.proposedPriority,
    chiefComplaint: ANSWERS['chief-complaint'].valueCoding,
    news2,
    patientId: PATIENT,
    encounterId: ENCOUNTER,
    performerId: PRACTITIONER,
    effectiveDateTime: now,
    criteria: ['15'],
    note: 'Bröstsmärta, pågående med misstanke om AKS.',
  }));
  check('triage Observation recorded, derived from NEWS2', triage.derivedFrom?.[0]?.reference, `Observation/${news2.id}`);
  check('triage priority', triage.valueCodeableConcept?.coding?.[0]?.code, '2');

  // Provisional: a new patient (the CQL reads every observation of the patient) with only the
  // respiratory rate, oxygen saturation and pulse of the example vital signs recorded so far
  const { id: _patientId, meta: _patientMeta, text: _patientText, ...examplePatient } = await client.read('Patient', PATIENT);
  const partialPatient = await client.create({
    ...examplePatient, ...(_patientMeta?.profile ? { meta: { profile: _patientMeta.profile } } : {}),
  });
  const partialEntries = [];
  for (const id of ['example-respiratory-rate', 'example-oxygen-saturation', 'example-heart-rate']) {
    const { id: _id, meta, text, encounter, ...observation } = await client.read('Observation', id);
    partialEntries.push({
      resource: {
        ...observation, ...(meta?.profile ? { meta: { profile: meta.profile } } : {}),
        subject: { reference: `Patient/${partialPatient.id}` }, effectiveDateTime: now,
      },
      request: { method: 'POST', url: 'Observation' },
    });
  }
  const partialIds = (await client.transaction({ resourceType: 'Bundle', type: 'transaction', entry: partialEntries }))
    .entry.map((e) => idOf(e.response?.location)).filter(Boolean);
  check('provisional: 3 vital signs recorded for a new patient', partialIds.length, 3);
  const partialContext = { patientId: partialPatient.id, practitionerId: PRACTITIONER };
  const partial = await runTriage(client, partialContext);
  check('provisional: NEWS2 not calculated', partial.news2.total, null);
  check('provisional: NEWS2 total so far (2+1+1)', partial.provisional.total, 4);
  check('provisional: clinical risk so far', partial.provisional.risk, 'low');
  check('provisional: missing parameters', partial.provisional.missing,
    ['airOrOxygen', 'systolicBloodPressure', 'consciousness', 'temperature']);
  check('provisional: priority so far', partial.provisional.priority?.code, '4');
  check('provisional: nothing proposed', partial.proposedPriority, null);
  const partialOrange = await runTriage(client, { ...partialContext, triageCriteria: ['15'] });
  check('provisional: an orange warning symptom gives orange so far', partialOrange.provisional.priority?.code, '2');
  check('provisional: still nothing proposed', partialOrange.proposedPriority, null);
  const preliminary = await client.create(news2Observation({
    news2: partial.news2, provisional: partial.provisional, patientId: partialPatient.id, performerId: PRACTITIONER, effectiveDateTime: now,
  }));
  check('preliminary NEWS2 recorded',
    [preliminary.status, preliminary.valueInteger, preliminary.component?.length, preliminary.derivedFrom?.length], ['preliminary', 4, 3, 3]);

  const write = (name, resource) => writeFile(join(args.out, name), `${JSON.stringify(resource, null, 2)}\n`);
  await write('news2.json', news2);
  await write('news2-preliminary.json', preliminary);
  await write('triage.json', triage);
  await write('careplan.json', green.carePlan);
  await write('results.json', Object.fromEntries(Object.entries({ green, red, yellow, unassessed, scale2, partial, partialOrange })
    .map(([k, v]) => [k, { ...v, carePlan: undefined }])));
  console.log(`Wrote news2.json, news2-preliminary.json, triage.json, careplan.json and results.json to ${args.out}`);

  if (failures.length) {
    console.error(`${failures.length} check(s) failed: ${failures.join('; ')}`);
    process.exit(1);
  }
  console.log('All checks passed');
}

main().catch((err) => {
  console.error(err.stack || err.message);
  process.exit(1);
});
