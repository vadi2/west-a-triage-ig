// Runs the WEST-A CQL logic against test cases, using the ELM that the IG Publisher
// translated from input/cql and embedded in the Library resources of the built IG.
//
//   node run.mjs <IG output directory>
//
// Five kinds of tests:
//   1. NEWS2 chart boundaries: generated from news2-chart.json, a transcription of the
//      chart on WEST-A p. 6. Every band's edges are tested for every parameter.
//   2. Triage criteria: generated from the WEST-A triage criterion code system of the built
//      IG. Every concept must get the priority of its priority property from the CQL.
//   3. Provisional NEWS2: generated from complete sets of vital signs, measured one parameter
//      at a time. The provisional total, risk, missing parameters and priority must match the
//      chart, and never be more than those of the complete measurements (a lower bound).
//   4. Scenarios: cases.json, for the totals, the clinical risk and the triage priority.
//   5. The guide's own examples: the example vital signs are run through the logic, and
//      the result must match the example NEWS2 Observations and the example triage.

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
const CRITERION_CS = 'https://vadi2.github.io/west-a-triage-ig/CodeSystem/west-a-triage-criterion-cs';
const OBSERVATION_CODE_CS = 'https://vadi2.github.io/west-a-triage-ig/CodeSystem/west-a-observation-code-cs';
const NEEDS_GROUP = 'AAK';
const NO_WARNING_SYMPTOMS = '163';
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

// One vital sign observation. options: minutesEarlier (negative for later than NOW), status,
// unit (instead of the profile's unit), period (timed with effectivePeriod, ending then)
function observation(patientId, id, parameter, value, options = {}) {
  const { minutesEarlier = 0, status = 'final', unit, period = false } = options;
  const time = new Date(NOW - minutesEarlier * 60000);
  const obs = {
    resourceType: 'Observation',
    id,
    status,
    subject: { reference: `Patient/${patientId}` },
    ...(period
      ? { effectivePeriod: { start: new Date(time - 5 * 60000).toISOString(), end: time.toISOString() } }
      : { effectiveDateTime: time.toISOString() }),
  };
  const q = (defaultUnit) => quantity(value, unit ?? defaultUnit);
  switch (parameter) {
    case 'respirationRate':
      return { ...obs, code: codeable([LOINC, '9279-1'], [SCT, '86290005']), valueQuantity: q('/min') };
    case 'oxygenSaturation':
      return { ...obs, code: codeable([LOINC, '2708-6'], [SCT, '431314004']), valueQuantity: q('%') };
    case 'oxygenFlow':
      return { ...obs, code: codeable([SCT, '427081008']), valueQuantity: q('L/min') };
    case 'systolic':
      return {
        ...obs,
        code: codeable([LOINC, '85354-9'], [SCT, '75367002']),
        component: [
          { code: codeable([LOINC, '8480-6'], [SCT, '271649006']), valueQuantity: q('mm[Hg]') },
          { code: codeable([LOINC, '8462-4'], [SCT, '271650006']), valueQuantity: quantity(80, 'mm[Hg]') },
        ],
      };
    case 'pulse':
      return { ...obs, code: codeable([LOINC, '8867-4'], [SCT, '364075005']), valueQuantity: q('/min') };
    case 'consciousness':
      return { ...obs, code: codeable([SCT, '1104441000000107']), valueCodeableConcept: codeable([SCT, value]) };
    case 'temperature':
      return { ...obs, code: codeable([LOINC, '8310-5'], [SCT, '386725007']), valueQuantity: q('Cel') };
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
    const { parameter, value, ...options } = e;
    entries.push(observation(patientId, `${patientId}-${++n}`, parameter, value, options));
  }
  return { resourceType: 'Bundle', type: 'collection', entry: entries.map((resource) => ({ resource })) };
}

// ---------------------------------------------------------------- the reference chart

// The chart gives whole numbers, and tenths of a degree for temperature: a value between
// two steps is rounded to the step, half up, as the CQL does
function lookup(table, value) {
  if (value === null || value === undefined) return null;
  const decimals = table.step < 1 ? 1 : 0;
  value = Math.round(Number((value * 10 ** decimals).toFixed(6))) / 10 ** decimals;
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
  // on scale 2, 93% or more scores differently on air and on oxygen, so it cannot be scored
  // when the oxygen is not recorded; below 93% both tables agree
  const scale2Score = () => {
    if (onOxygen !== null) return lookup(onOxygen ? p.oxygenSaturationScale2OnOxygen : p.oxygenSaturationScale2OnAir, vitals.oxygenSaturation);
    const air = lookup(p.oxygenSaturationScale2OnAir, vitals.oxygenSaturation);
    return air === lookup(p.oxygenSaturationScale2OnOxygen, vitals.oxygenSaturation) ? air : null;
  };
  const scores = {
    'Respiration Rate Score': lookup(p.respirationRate, vitals.respirationRate),
    'Oxygen Saturation Scale 1 Score': lookup(p.oxygenSaturationScale1, vitals.oxygenSaturation),
    'Oxygen Saturation Scale 2 Score': scale2Score(),
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
  const known = seven.filter((s) => s !== null);
  const sum = known.length ? known.reduce((a, b) => a + b, 0) : null;
  const total = known.length === 7 ? sum : null;
  scores['Oxygen Saturation Score'] = seven[1];
  scores['NEWS2 Total Score'] = total;
  scores['NEWS2 Clinical Risk'] = riskBand(total, seven);
  scores['Provisional NEWS2 Total Score'] = sum;
  scores['Provisional NEWS2 Clinical Risk'] = riskBand(sum, seven);
  scores['NEWS2 Missing Parameters'] = parameterNames(scale2).filter((_, i) => seven[i] === null);
  return scores;
}

// The names of the seven parameters, in the order of the chart, as the CQL lists them: the
// component slices of the WEST-A NEWS2 Observation profile
const parameterNames = (scale2) => ['respirationRate', scale2 ? 'oxygenSaturationScale2' : 'oxygenSaturationScale1', 'airOrOxygen', 'systolicBloodPressure', 'pulse', 'consciousness', 'temperature'];

function riskBand(total, scores) {
  return total === null ? null : total >= 7 ? 'high' : total >= 5 ? 'medium' : scores.includes(3) ? 'low-medium' : 'low';
}

// The priority code of a clinical risk band (WEST-A p. 6)
const RISK_PRIORITY = { high: '1', medium: '2', 'low-medium': '3', low: '4' };
const mostUrgent = (...codes) => codes.filter(Boolean).sort()[0] ?? null;

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

// ---------------------------------------------------------------- the triage criteria

// One case per concept of the triage criterion code system, with normal vital signs (green):
// a warning symptom gives the priority of its priority property, a need gives yellow as the
// lowest priority and no warning symptom priority, a group and "no warning symptoms" give none
function criterionCases() {
  const cs = JSON.parse(fs.readFileSync(path.join(outputDir, 'CodeSystem-west-a-triage-criterion-cs.json'), 'utf8'));
  const cases = [];
  const property = (concept, code) => (concept.property ?? []).filter((p) => p.code === code);
  for (const concept of cs.concept) {
    const priority = property(concept, 'priority')[0]?.valueCoding;
    const group = property(concept, 'parent')[0]?.valueCode;
    const notSelectable = property(concept, 'notSelectable')[0]?.valueBoolean === true;
    if (priority && priority.system !== PRIORITY_CS) throw new Error(`criterion ${concept.code}: priority from ${priority.system}`);
    let expect;
    if (notSelectable) {
      if (priority) throw new Error(`group ${concept.code} has a priority`);
      expect = { 'Warning Symptom Priority': null, 'Lowest Priority From Needs': null, 'Proposed Priority': null };
    } else if (concept.code === NO_WARNING_SYMPTOMS) {
      expect = { 'Warning Symptom Priority': '4', 'Lowest Priority From Needs': null, 'Proposed Priority': '4' };
    } else if (group === NEEDS_GROUP) {
      if (priority?.code !== '3') throw new Error(`need ${concept.code} is not yellow`);
      expect = { 'Warning Symptom Priority': null, 'Lowest Priority From Needs': '3', 'Proposed Priority': null };
    } else {
      if (!priority) throw new Error(`criterion ${concept.code} has no priority`);
      expect = { 'Warning Symptom Priority': priority.code, 'Assessed Complaint Priority': priority.code, 'Proposed Priority': priority.code };
    }
    cases.push({
      name: `Criterion ${concept.code} "${concept.display}"`,
      vitals: {},
      parameters: { 'Triage Criteria': [concept.code] },
      expect: { WestATriage: expect },
    });
  }
  return cases;
}

// ---------------------------------------------------------------- provisional NEWS2

// Complete sets of vital signs, each measured one parameter at a time in two orders: every
// step must give the provisional NEWS2 of the chart for what is measured so far, and never
// more than the complete set gives. complaintPriority is the assessed warning symptoms
// (null: not assessed), which the provisional priority includes from the start.
const PROVISIONAL_SETS = [
  { name: 'the guide\'s examples (NEWS2 5)', vitals: { respirationRate: 22, oxygenSaturation: 95, systolic: 105, pulse: 95, temperature: 37.5 }, complaintPriority: '4' },
  { name: 'a single 3 (low-medium)', vitals: { respirationRate: 26 }, complaintPriority: null },
  { name: 'NEWS2 13 (high)', vitals: { respirationRate: 25, oxygenSaturation: 90, oxygenFlow: 2, systolic: 95, consciousness: '450847001' }, complaintPriority: '3' },
  { name: 'all normal (low)', vitals: {}, complaintPriority: null },
  { name: 'scale 2 on oxygen', vitals: { oxygenSaturation: 97, oxygenFlow: 2, pulse: 115 }, complaintPriority: '4', scale2: true },
  { name: 'scale 2 on air, orange warning symptom', vitals: { oxygenSaturation: 95, temperature: 39.5 }, complaintPriority: '2', scale2: true },
];
const PARAMETERS = ['respirationRate', 'oxygenSaturation', 'oxygenFlow', 'systolic', 'pulse', 'consciousness', 'temperature'];

function provisionalCases() {
  const cases = [];
  for (const set of PROVISIONAL_SETS) {
    const full = { ...BASELINE, ...set.vitals };
    const scale2 = !!set.scale2;
    const final = expectedNews2(full, scale2);
    const finalPriority = mostUrgent(RISK_PRIORITY[final['NEWS2 Clinical Risk']], set.complaintPriority);
    const parameters = {
      ...(set.complaintPriority ? { 'Complaint Priority': set.complaintPriority } : {}),
      ...(scale2 ? { 'Use Oxygen Saturation Scale 2': true } : {}),
    };
    for (const order of [PARAMETERS, [...PARAMETERS].reverse()]) {
      for (let measured = 0; measured <= 7; measured++) {
        if (order !== PARAMETERS && (measured === 0 || measured === 7)) continue;
        const vitals = Object.fromEntries(PARAMETERS.map((p) => [p, order.slice(0, measured).includes(p) ? full[p] : null]));
        const expected = expectedNews2(vitals, scale2);
        const provisionalPriority = mostUrgent(RISK_PRIORITY[expected['Provisional NEWS2 Clinical Risk']], set.complaintPriority);
        cases.push({
          name: `Provisional: ${set.name}, ${measured === 7 ? 'all measured' : `${order.slice(0, measured).join(', ') || 'nothing'} measured`}`,
          vitals,
          parameters,
          expect: {
            WestANEWS2: {
              'Provisional NEWS2 Total Score': expected['Provisional NEWS2 Total Score'],
              'Provisional NEWS2 Clinical Risk': expected['Provisional NEWS2 Clinical Risk'],
              'NEWS2 Missing Parameters': expected['NEWS2 Missing Parameters'],
              'NEWS2 Total Score': expected['NEWS2 Total Score'],
            },
            WestATriage: { 'Provisional Proposed Priority': provisionalPriority },
          },
          // a lower bound: never more than the complete measurements, and the same once complete
          check: ({ WestANEWS2: n, WestATriage: t }) => {
            const total = n['Provisional NEWS2 Total Score'];
            if (total !== null && total > final['NEWS2 Total Score']) return `provisional total ${total} is more than the final ${final['NEWS2 Total Score']}`;
            const priority = t['Provisional Proposed Priority'];
            if (priority !== null && finalPriority !== null && priority < finalPriority) return `provisional priority ${priority} is more urgent than the final ${finalPriority}`;
            if (measured === 7 && total !== final['NEWS2 Total Score']) return `provisional total ${total} is not the final ${final['NEWS2 Total Score']} with all measured`;
            if (measured === 7 && set.complaintPriority && t['Proposed Priority'] !== priority) return `provisional priority ${priority} is not the proposed ${t['Proposed Priority']} with all measured`;
            if (measured < 7 && t['Proposed Priority'] !== null) return `a priority is proposed with ${7 - measured} parameters missing`;
            return null;
          },
        });
      }
    }
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
  const criteria = (triage.component ?? [])
    .filter((c) => c.code.coding.some((k) => k.system === OBSERVATION_CODE_CS && k.code === '1'))
    .map((c) => c.valueCodeableConcept.coding.find((k) => k.system === CRITERION_CS).code);
  if (!criteria.length) throw new Error('example-triage-chest-pain: no triage criteria');
  return {
    name: 'Examples: the example vital signs give the example NEWS2, and the example triage criteria and NEWS2 give the example priority',
    bundle: { resourceType: 'Bundle', type: 'collection', entry: [patient, ...vitals].map((resource) => ({ resource })) },
    patientId: patient.id,
    parameters: { 'Triage Criteria': criteria },
    expect: { WestANEWS2: expectNews2, WestATriage: { 'Proposed Priority': recorded } },
  };
}

// The example provisional NEWS2: its vital signs give its scores and its total so far
function preliminaryExampleCase() {
  const read = (name) => JSON.parse(fs.readFileSync(path.join(outputDir, `${name}.json`), 'utf8'));
  const news2 = read('Observation-example-news2-preliminary');
  if (news2.status !== 'preliminary') throw new Error('example-news2-preliminary: not preliminary');
  const vitals = news2.derivedFrom.map((ref) => read(`Observation-${ref.reference.split('/')[1]}`));
  const patient = read(`Patient-${news2.subject.reference.split('/')[1]}`);
  const names = {
    '1104301000000104': 'Respiration Rate Score',
    '1104311000000102': 'Oxygen Saturation Scale 1 Score',
    '1104331000000105': 'Supplemental Oxygen Score',
    '1104341000000101': 'Systolic Blood Pressure Score',
    '1104351000000103': 'Pulse Score',
    '1104361000000100': 'Consciousness Score',
    '1104371000000107': 'Temperature Score',
  };
  const expect = { 'Provisional NEWS2 Total Score': news2.valueInteger, 'NEWS2 Total Score': null };
  for (const name of Object.values(names)) expect[name] = null;
  for (const component of news2.component ?? []) {
    const code = component.code.coding.find((c) => c.system === SCT)?.code;
    if (!names[code]) throw new Error(`example-news2-preliminary: unexpected component ${code}`);
    expect[names[code]] = component.valueInteger;
  }
  const scoreOf = ['Respiration Rate Score', 'Oxygen Saturation Scale 1 Score', 'Supplemental Oxygen Score', 'Systolic Blood Pressure Score', 'Pulse Score', 'Consciousness Score', 'Temperature Score'];
  expect['NEWS2 Missing Parameters'] = parameterNames(false).filter((_, i) => expect[scoreOf[i]] === null);
  return {
    name: 'Examples: the example vital signs measured so far give the example provisional NEWS2',
    bundle: { resourceType: 'Bundle', type: 'collection', entry: [patient, ...vitals].map((resource) => ({ resource })) },
    patientId: patient.id,
    expect: { WestANEWS2: expect },
  };
}

// ---------------------------------------------------------------- running

// A triage priority code is compared by its code alone; a code from any other system
// keeps its system, so that it cannot match an expected priority
const normalize = (v) =>
  v === undefined || v === null ? null
  : Array.isArray(v) ? v.map(normalize)
  : typeof v === 'object' && 'code' in v && 'system' in v ? (v.system === PRIORITY_CS ? v.code : `${v.system}|${v.code}`)
  : v;

const same = (a, b) => (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-9
  : Array.isArray(a) || Array.isArray(b) ? JSON.stringify(a) === JSON.stringify(b)
  : a === b);

// The parameters each library declares. Every one is passed, as null (false for a Boolean)
// when the case does not set it: cql-execution 3.3.2 returns the parameter definition
// itself for a parameter that is not passed, and ignores the default.
const declared = (name) =>
  Object.fromEntries((elm[name].library.parameters?.def ?? []).map((d) => [d.name, d.parameterTypeSpecifier?.name]));
const BOOLEAN = '{urn:hl7-org:elm-types:r1}Boolean';

function cqlParameters(name, parameters) {
  const known = new Set(['WestANEWS2', 'WestATriage'].flatMap((n) => Object.keys(declared(n))));
  for (const key of Object.keys(parameters ?? {})) {
    if (!known.has(key)) throw new Error(`unknown CQL parameter "${key}"`);
  }
  const out = {};
  for (const [key, type] of Object.entries(declared(name))) {
    const value = (parameters ?? {})[key];
    if (value === undefined || value === null) {
      out[key] = type === BOOLEAN ? false : null;
    } else if (key === 'Complaint Priority') {
      const [system, code] = value.includes('|') ? value.split('|') : [PRIORITY_CS, value];
      out[key] = new cql.Code(code, system);
    } else if (key === 'Triage Criteria') {
      out[key] = value.map((v) => {
        const [system, code] = v.includes('|') ? v.split('|') : [CRITERION_CS, v];
        return new cql.Code(code, system);
      });
    } else {
      out[key] = value;
    }
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

const boundaries = boundaryCases();
if (boundaries.length < 50 || scenarios.length < 20) {
  console.log(`::error::too few CQL test cases: ${boundaries.length} chart cases and ${scenarios.length} scenarios`);
  process.exit(1);
}
const criteria = criterionCases();
if (criteria.length < 150) {
  console.log(`::error::too few triage criteria: ${criteria.length}`);
  process.exit(1);
}
const provisional = provisionalCases();
const all = [...boundaries, ...criteria, ...provisional, ...scenarios, exampleCase(), preliminaryExampleCase()];
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
