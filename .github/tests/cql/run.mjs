// Runs the WEST-A CQL logic against test cases, using the ELM that the IG Publisher
// translated from input/cql and embedded in the Library resources of the built IG.
//
//   node run.mjs <IG output directory>
//
// Three kinds of tests:
//   1. NEWS2 chart boundaries: generated from news2-chart.json, a transcription of the
//      chart on WEST-A p. 6. Every band's edges are tested for every parameter.
//   2. Scenarios: cases.json, for the totals, the clinical risk and the triage priority.
//   3. The guide's own examples: the example vital signs are run through the logic, and
//      the result must match the example NEWS2 Observation and the example triage.

import fs from 'node:fs';
import path from 'node:path';
import cql from 'cql-execution';
import cqlfhir from 'cql-exec-fhir';

const here = path.dirname(new URL(import.meta.url).pathname);
const outputDir = process.argv[2] ?? 'output';
const chart = JSON.parse(fs.readFileSync(path.join(here, 'news2-chart.json'), 'utf8'));
const scenarios = JSON.parse(fs.readFileSync(path.join(here, 'cases.json'), 'utf8')).cases;

const SCT = 'http://snomed.info/sct';
const LOINC = 'http://loinc.org';
const UCUM = 'http://unitsofmeasure.org';
const PRIORITY_CS = 'https://vadi2.github.io/west-a-triage-ig/CodeSystem/west-a-triage-priority-cs';
const ALERT = '248234008';
const NOW = Date.parse('2026-11-19T08:38:00Z');

// ---------------------------------------------------------------- ELM from the built IG

function loadElm() {
  const elm = {};
  for (const file of fs.readdirSync(outputDir)) {
    if (!/^Library-.*\.json$/.test(file)) continue;
    const library = JSON.parse(fs.readFileSync(path.join(outputDir, file), 'utf8'));
    const content = (library.content ?? []).find((c) => c.contentType === 'application/elm+json');
    if (!content?.data) continue;
    const json = JSON.parse(Buffer.from(content.data, 'base64').toString('utf8'));
    elm[json.library.identifier.id] = json;
  }
  for (const name of ['FHIRHelpers', 'WestANEWS2', 'WestATriage']) {
    if (!elm[name]) {
      console.error(`::error::No ELM for library ${name} in ${outputDir}: did the IG Publisher translate input/cql/${name}.cql?`);
      process.exit(1);
    }
  }
  return elm;
}

const elm = loadElm();
const repository = new cql.Repository(elm);
const libraries = {
  WestANEWS2: new cql.Library(elm.WestANEWS2, repository),
  WestATriage: new cql.Library(elm.WestATriage, repository),
};

// ---------------------------------------------------------------- test data

const BASELINE = {
  respirationRate: 16,
  oxygenSaturation: 97,
  oxygenFlow: 0,
  systolic: 120,
  pulse: 70,
  consciousness: ALERT,
  temperature: 37.0,
};

const quantity = (value, unit) => ({ value, unit, system: UCUM, code: unit });
const codeable = (...codings) => ({ coding: codings.map(([system, code]) => ({ system, code })) });

function observation(patientId, id, parameter, value, minutesEarlier = 0, status = 'final') {
  const obs = {
    resourceType: 'Observation',
    id,
    status,
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: new Date(NOW - minutesEarlier * 60000).toISOString(),
  };
  switch (parameter) {
    case 'respirationRate':
      return { ...obs, code: codeable([LOINC, '9279-1'], [SCT, '86290005']), valueQuantity: quantity(value, '/min') };
    case 'oxygenSaturation':
      return { ...obs, code: codeable([LOINC, '2708-6'], [SCT, '431314004']), valueQuantity: quantity(value, '%') };
    case 'oxygenFlow':
      return { ...obs, code: codeable([SCT, '427081008']), valueQuantity: quantity(value, 'L/min') };
    case 'systolic':
      return {
        ...obs,
        code: codeable([LOINC, '85354-9'], [SCT, '75367002']),
        component: [
          { code: codeable([LOINC, '8480-6'], [SCT, '271649006']), valueQuantity: quantity(value, 'mm[Hg]') },
          { code: codeable([LOINC, '8462-4'], [SCT, '271650006']), valueQuantity: quantity(80, 'mm[Hg]') },
        ],
      };
    case 'pulse':
      return { ...obs, code: codeable([LOINC, '8867-4'], [SCT, '364075005']), valueQuantity: quantity(value, '/min') };
    case 'consciousness':
      return { ...obs, code: codeable([SCT, '1104441000000107']), valueCodeableConcept: codeable([SCT, value]) };
    case 'temperature':
      return { ...obs, code: codeable([LOINC, '8310-5'], [SCT, '386725007']), valueQuantity: quantity(value, 'Cel') };
    default:
      throw new Error(`Unknown parameter ${parameter}`);
  }
}

function bundleFor(patientId, vitals, extra = []) {
  const entries = [{ resourceType: 'Patient', id: patientId }];
  let n = 0;
  for (const [parameter, value] of Object.entries(vitals)) {
    if (value !== null) entries.push(observation(patientId, `${patientId}-${++n}`, parameter, value));
  }
  for (const e of extra) {
    entries.push(observation(patientId, `${patientId}-${++n}`, e.parameter, e.value, e.minutesEarlier, e.status));
  }
  return { resourceType: 'Bundle', type: 'collection', entry: entries.map((resource) => ({ resource })) };
}

// ---------------------------------------------------------------- the reference chart

function lookup(table, value) {
  if (value === null || value === undefined) return null;
  const band = table.bands.find(
    (b) => (b.min === undefined || value >= b.min - 1e-9) && (b.max === undefined || value <= b.max + 1e-9)
  );
  if (!band) throw new Error(`No band for ${value}`);
  return band.score;
}

// The expected scores, from the chart, for a set of vital signs
function expectedNews2(vitals, scale2) {
  const p = chart.parameters;
  const onOxygen = vitals.oxygenFlow === null ? null : vitals.oxygenFlow > 0;
  const scale2Table = onOxygen ? p.oxygenSaturationScale2OnOxygen : p.oxygenSaturationScale2OnAir;
  const scores = {
    'Respiration Rate Score': lookup(p.respirationRate, vitals.respirationRate),
    'Oxygen Saturation Scale 1 Score': scale2 ? null : lookup(p.oxygenSaturationScale1, vitals.oxygenSaturation),
    'Oxygen Saturation Scale 2 Score': scale2 ? lookup(scale2Table, vitals.oxygenSaturation) : null,
    'Supplemental Oxygen Score': onOxygen === null ? null : onOxygen ? chart.supplementalOxygen.onOxygen : chart.supplementalOxygen.onAir,
    'Systolic Blood Pressure Score': lookup(p.systolicBloodPressure, vitals.systolic),
    'Pulse Score': lookup(p.pulse, vitals.pulse),
    'Consciousness Score': vitals.consciousness === null ? null : vitals.consciousness === ALERT ? chart.consciousness.alert : chart.consciousness.other,
    'Temperature Score': lookup(p.temperature, vitals.temperature),
  };
  const seven = [
    scores['Respiration Rate Score'],
    scale2 ? scores['Oxygen Saturation Scale 2 Score'] : scores['Oxygen Saturation Scale 1 Score'],
    scores['Supplemental Oxygen Score'],
    scores['Systolic Blood Pressure Score'],
    scores['Pulse Score'],
    scores['Consciousness Score'],
    scores['Temperature Score'],
  ];
  const complete = seven.every((s) => s !== null);
  const total = complete ? seven.reduce((a, b) => a + b, 0) : null;
  scores['NEWS2 Total Score'] = total;
  scores['NEWS2 Clinical Risk'] =
    total === null ? null : total >= 7 ? 'high' : total >= 5 ? 'medium' : seven.includes(3) ? 'low-medium' : 'low';
  return scores;
}

// Values on both edges of every band of the chart
function boundaryCases() {
  const cases = [];
  const groups = [
    ['respirationRate', 'respirationRate', {}, false],
    ['oxygenSaturationScale1', 'oxygenSaturation', {}, false],
    ['oxygenSaturationScale2OnAir', 'oxygenSaturation', { oxygenFlow: 0 }, true],
    ['oxygenSaturationScale2OnOxygen', 'oxygenSaturation', { oxygenFlow: 2 }, true],
    ['systolicBloodPressure', 'systolic', {}, false],
    ['pulse', 'pulse', {}, false],
    ['temperature', 'temperature', {}, false],
  ];
  for (const [table, parameter, fixed, scale2] of groups) {
    const { bands, step } = chart.parameters[table];
    const round = (v) => Number(v.toFixed(step < 1 ? 1 : 0));
    for (const band of bands) {
      const values = new Set();
      if (band.min !== undefined) values.add(band.min);
      if (band.max !== undefined) values.add(band.max);
      if (band.min === undefined) values.add(round(band.max - 5 * step));
      if (band.max === undefined) values.add(round(band.min + 5 * step));
      for (let value of values) {
        if (parameter === 'oxygenSaturation') value = Math.min(value, 100);
        const vitals = { ...BASELINE, ...fixed, [parameter]: value };
        cases.push({
          name: `Chart: ${table} ${value} scores ${band.score}`,
          vitals,
          parameters: scale2 ? { 'Use Oxygen Saturation Scale 2': true } : {},
          expect: { WestANEWS2: expectedNews2(vitals, scale2) },
        });
      }
    }
  }
  // supplemental oxygen and every level of consciousness
  for (const oxygenFlow of [0, 0.5, 15]) {
    const vitals = { ...BASELINE, oxygenFlow };
    cases.push({ name: `Chart: oxygen flow ${oxygenFlow} L/min`, vitals, parameters: {}, expect: { WestANEWS2: expectedNews2(vitals, false) } });
  }
  for (const consciousness of [ALERT, '130987000', '300202002', '450847001', '422768004']) {
    const vitals = { ...BASELINE, consciousness };
    cases.push({ name: `Chart: ACVPU ${consciousness}`, vitals, parameters: {}, expect: { WestANEWS2: expectedNews2(vitals, false) } });
  }
  return cases;
}

// ---------------------------------------------------------------- the guide's examples

function exampleCase() {
  const read = (name) => JSON.parse(fs.readFileSync(path.join(outputDir, `${name}.json`), 'utf8'));
  const news2 = read('Observation-example-news2');
  const triage = read('Observation-example-triage-chest-pain');
  const vitals = news2.derivedFrom.map((ref) => read(`Observation-${ref.reference.split('/')[1]}`));
  const patient = read(`Patient-${news2.subject.reference.split('/')[1]}`);

  const componentDefines = {
    '1104301000000104': 'Respiration Rate Score',
    '1104311000000102': 'Oxygen Saturation Scale 1 Score',
    '1104321000000108': 'Oxygen Saturation Scale 2 Score',
    '1104331000000105': 'Supplemental Oxygen Score',
    '1104341000000101': 'Systolic Blood Pressure Score',
    '1104351000000103': 'Pulse Score',
    '1104361000000100': 'Consciousness Score',
    '1104371000000107': 'Temperature Score',
  };
  const expectNews2 = { 'NEWS2 Total Score': news2.valueInteger };
  for (const component of news2.component ?? []) {
    const code = component.code.coding.find((c) => c.system === SCT)?.code;
    if (!componentDefines[code]) throw new Error(`example-news2: unknown component ${code}`);
    expectNews2[componentDefines[code]] = component.valueInteger;
  }
  const recorded = triage.valueCodeableConcept.coding.find((c) => c.system === PRIORITY_CS).code;
  return {
    name: 'Examples: the example vital signs give the example NEWS2, and the example triage is at least as urgent as its vital parameters',
    bundle: { resourceType: 'Bundle', type: 'collection', entry: [patient, ...vitals].map((resource) => ({ resource })) },
    patientId: patient.id,
    parameters: {},
    expect: { WestANEWS2: expectNews2 },
    check: (results) => {
      const vitalPriority = results.WestATriage['Vital Parameter Priority'];
      return vitalPriority !== null && recorded <= vitalPriority
        ? null
        : `example triage priority ${recorded} is less urgent than the vital parameter priority ${vitalPriority}`;
    },
  };
}

// ---------------------------------------------------------------- running

const normalize = (v) =>
  v === undefined || v === null ? null
  : Array.isArray(v) ? v.map(normalize)
  : typeof v === 'object' && 'code' in v && 'system' in v ? v.code
  : v;

const same = (a, b) => (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-9 : a === b);

function cqlParameters(name, parameters) {
  const out = {};
  for (const [key, value] of Object.entries(parameters ?? {})) {
    if (key === 'Use Oxygen Saturation Scale 2' && name === 'WestANEWS2') out[key] = value;
    if (key === 'Complaint Priority' && name === 'WestATriage') out[key] = new cql.Code(value, PRIORITY_CS);
    if (key === 'Yellow As Lowest Priority' && name === 'WestATriage') out[key] = value;
  }
  return out;
}

async function evaluate(name, bundle, patientId, parameters) {
  const source = cqlfhir.PatientSource.FHIRv401();
  source.loadBundles([bundle]);
  const executor = new cql.Executor(libraries[name], new cql.CodeService({}), cqlParameters(name, parameters));
  const results = await executor.exec(source, cql.DateTime.fromJSDate(new Date(NOW)));
  const patientResults = results.patientResults[patientId];
  if (!patientResults) throw new Error(`no results for patient ${patientId}`);
  return Object.fromEntries(Object.entries(patientResults).map(([k, v]) => [k, normalize(v)]));
}

async function run(testCase, index) {
  const patientId = testCase.patientId ?? `case-${index}`;
  const vitals = { ...BASELINE, ...(testCase.vitals ?? {}) };
  const bundle = testCase.bundle ?? bundleFor(patientId, vitals, testCase.extra);
  if ((testCase.parameters ?? {})['Use Oxygen Saturation Scale 2'] && testCase.expect.WestATriage) {
    throw new Error(`${testCase.name}: WestATriage cases cannot set the scale 2 parameter of the included NEWS2 library`);
  }
  const results = {};
  const failures = [];
  for (const name of ['WestANEWS2', 'WestATriage']) {
    results[name] = await evaluate(name, bundle, patientId, testCase.parameters);
    for (const [define, expected] of Object.entries(testCase.expect[name] ?? {})) {
      if (!(define in results[name])) {
        failures.push(`${name}."${define}" is not defined`);
      } else if (!same(results[name][define], expected)) {
        failures.push(`${name}."${define}": expected ${JSON.stringify(expected)}, got ${JSON.stringify(results[name][define])}`);
      }
    }
  }
  const extra = testCase.check?.(results);
  if (extra) failures.push(extra);
  return failures;
}

const all = [...boundaryCases(), ...scenarios, exampleCase()];
let failed = 0;
for (const [index, testCase] of all.entries()) {
  let failures;
  try {
    failures = await run(testCase, index);
  } catch (e) {
    failures = [`error: ${e.stack ?? e}`];
  }
  if (failures.length) {
    failed++;
    console.log(`FAIL ${testCase.name}`);
    for (const f of failures) console.log(`     ${f}`);
  } else {
    console.log(`pass ${testCase.name}`);
  }
}
console.log(`\n${all.length - failed} of ${all.length} CQL test cases passed`);
if (failed) {
  console.log(`::error::${failed} of ${all.length} CQL test cases failed`);
  process.exit(1);
}
