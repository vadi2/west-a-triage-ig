import type { FhirResource, Observation, Questionnaire } from 'fhir/r4';
import questionnaire from './questionnaire.json';

// The guide's examples (input/fsh/examples), as HAPI holds them after demo/hapi/load.mjs,
// plus two synthetic patients so the queue is not empty. All data is fictitious.
const IG = 'https://vadi2.github.io/west-a-triage-ig';
const SCT = 'http://snomed.info/sct';
const LOINC = 'http://loinc.org';
const UCUM = 'http://unitsofmeasure.org';
const CAT = 'http://terminology.hl7.org/CodeSystem/observation-category';
const HTEST = { system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason', code: 'HTEST', display: 'test health data' };
const sd = (id: string) => ({ profile: [`${IG}/StructureDefinition/${id}`] });
const cat = (code: string, display: string) => [{ coding: [{ system: CAT, code, display }] }];

function triageSet(opts: {
  patient: string;
  encounter: string;
  prefix: string;
  at: string;
  rr: number;
  spo2: number;
  o2: number;
  sys: number;
  dia: number;
  hr: number;
  acvpu: [string, string];
  temp: number;
  scores: [number, number, number, number, number, number, number];
  priority: [string, string];
  complaint: [string, string];
  note?: string;
}): Observation[] {
  const ctx = {
    status: 'final' as const,
    subject: { reference: `Patient/${opts.patient}` },
    encounter: { reference: `Encounter/${opts.encounter}` },
    performer: [{ reference: 'Practitioner/example-practitioner-triage-nurse' }],
    effectiveDateTime: opts.at,
  };
  const id = (s: string) => `${opts.prefix}${s}`;
  const q = (value: number, code: string, unit = code) => ({ value, unit, system: UCUM, code });
  const vitals: Observation[] = [
    { resourceType: 'Observation', id: id('respiratory-rate'), meta: sd('west-a-respiratory-rate'), ...ctx, category: cat('vital-signs', 'Vital Signs'), code: { coding: [{ system: LOINC, code: '9279-1', display: 'Respiratory rate' }] }, valueQuantity: q(opts.rr, '/min') },
    { resourceType: 'Observation', id: id('oxygen-saturation'), meta: sd('west-a-oxygen-saturation'), ...ctx, category: cat('vital-signs', 'Vital Signs'), code: { coding: [{ system: LOINC, code: '2708-6', display: 'Oxygen saturation in Arterial blood' }] }, valueQuantity: q(opts.spo2, '%') },
    { resourceType: 'Observation', id: id('supplemental-oxygen'), meta: sd('west-a-supplemental-oxygen'), ...ctx, category: cat('therapy', 'Therapy'), code: { coding: [{ system: SCT, code: '427081008', display: 'Delivered oxygen flow rate' }] }, valueQuantity: q(opts.o2, 'L/min') },
    {
      resourceType: 'Observation', id: id('blood-pressure'), meta: sd('west-a-blood-pressure'), ...ctx, category: cat('vital-signs', 'Vital Signs'),
      code: { coding: [{ system: LOINC, code: '85354-9', display: 'Blood pressure panel with all children optional' }] },
      component: [
        { code: { coding: [{ system: LOINC, code: '8480-6', display: 'Systolic blood pressure' }] }, valueQuantity: q(opts.sys, 'mm[Hg]', 'mmHg') },
        { code: { coding: [{ system: LOINC, code: '8462-4', display: 'Diastolic blood pressure' }] }, valueQuantity: q(opts.dia, 'mm[Hg]', 'mmHg') },
      ],
    },
    { resourceType: 'Observation', id: id('heart-rate'), meta: sd('west-a-heart-rate'), ...ctx, category: cat('vital-signs', 'Vital Signs'), code: { coding: [{ system: LOINC, code: '8867-4', display: 'Heart rate' }] }, valueQuantity: q(opts.hr, '/min') },
    { resourceType: 'Observation', id: id('consciousness'), meta: sd('west-a-consciousness'), ...ctx, category: cat('exam', 'Exam'), code: { coding: [{ system: SCT, code: '1104441000000107', display: 'ACVPU (Alert Confusion Voice Pain Unresponsive) scale score' }] }, valueCodeableConcept: { coding: [{ system: SCT, code: opts.acvpu[0], display: opts.acvpu[1] }] } },
    { resourceType: 'Observation', id: id('body-temperature'), meta: sd('west-a-body-temperature'), ...ctx, category: cat('vital-signs', 'Vital Signs'), code: { coding: [{ system: LOINC, code: '8310-5', display: 'Body temperature' }] }, valueQuantity: q(opts.temp, 'Cel', '°C') },
  ];
  const later = (min: number) => new Date(new Date(opts.at).getTime() + min * 60000).toISOString().replace('.000Z', 'Z');
  const comp = (code: string, v: number) => ({ code: { coding: [{ system: SCT, code }] }, valueInteger: v });
  const total = opts.scores.reduce((a, b) => a + b, 0);
  const news2: Observation = {
    resourceType: 'Observation', id: id('news2'), meta: sd('west-a-news2-observation'), ...ctx, effectiveDateTime: later(2),
    category: cat('survey', 'Survey'),
    code: { coding: [{ system: SCT, code: '1104051000000101', display: 'Royal College of Physicians NEWS2 (National Early Warning Score 2) total score' }] },
    valueInteger: total,
    derivedFrom: vitals.map((v) => ({ reference: `Observation/${v.id}` })),
    component: [
      comp('1104301000000104', opts.scores[0]),
      comp('1104311000000102', opts.scores[1]),
      comp('1104331000000105', opts.scores[2]),
      comp('1104341000000101', opts.scores[3]),
      comp('1104351000000103', opts.scores[4]),
      comp('1104361000000100', opts.scores[5]),
      comp('1104371000000107', opts.scores[6]),
    ],
  };
  const triage: Observation = {
    resourceType: 'Observation', id: id('triage'), meta: sd('west-a-triage-observation'), ...ctx, effectiveDateTime: later(4),
    category: cat('survey', 'Survey'),
    code: { coding: [{ system: SCT, code: '425705009', display: 'Determination of acuity level' }] },
    valueCodeableConcept: { coding: [{ system: `${IG}/CodeSystem/west-a-triage-priority-cs`, code: opts.priority[0], display: opts.priority[1] }] },
    derivedFrom: [{ reference: `Observation/${news2.id}` }],
    component: [{ code: { coding: [{ system: SCT, code: '1269489004', display: 'Chief complaint' }] }, valueCodeableConcept: { coding: [{ system: `${IG}/CodeSystem/west-a-chief-complaint-cs`, code: opts.complaint[0], display: opts.complaint[1] }] } }],
    note: opts.note ? [{ text: opts.note }] : undefined,
  };
  return [...vitals, news2, triage];
}

export function seedResources(): FhirResource[] {
  return [
    questionnaire as Questionnaire,
    {
      resourceType: 'Patient', id: 'example-patient-personnummer', meta: sd('west-a-patient'), language: 'sv',
      identifier: [{ system: 'http://electronichealth.se/identifier/personnummer', value: '196101182803' }],
      name: [{ use: 'official', family: 'Ljungberg', given: ['Maria', 'Birgitta'], text: 'Maria Ljungberg' }],
      gender: 'female', birthDate: '1961-01-18',
    },
    {
      resourceType: 'Patient', id: 'example-patient-samordningsnummer', meta: sd('west-a-patient'), language: 'sv',
      identifier: [{ system: 'http://electronichealth.se/identifier/samordningsnummer', value: '198503723135' }],
      name: [{ use: 'official', family: 'Haddad', given: ['Karim'], text: 'Karim Haddad' }],
      gender: 'male', birthDate: '1985-03-12',
    },
    {
      resourceType: 'Patient', id: 'example-patient-lrid', meta: sd('west-a-patient'), language: 'sv',
      identifier: [{ system: 'https://fhir.vgregion.se/NamingSystem/LRID', value: '19700101M081' }],
      gender: 'male', birthDate: '1970',
    },
    {
      resourceType: 'Patient', id: 'synthetic-1', meta: { ...sd('west-a-patient'), tag: [HTEST] }, language: 'sv',
      identifier: [{ use: 'temp', system: 'https://fhir.vgregion.se/NamingSystem/LRID', value: '19420607K914' }],
      name: [{ use: 'official', family: 'Nyström', given: ['Gunilla'], text: 'Gunilla Nyström' }],
      gender: 'female', birthDate: '1942-06-07',
    },
    {
      resourceType: 'Patient', id: 'synthetic-2', meta: { ...sd('west-a-patient'), tag: [HTEST] }, language: 'sv',
      identifier: [{ use: 'temp', system: 'https://fhir.vgregion.se/NamingSystem/LRID', value: '19990312M927' }],
      name: [{ use: 'official', family: 'Abdi', given: ['Ali'], text: 'Ali Abdi' }],
      gender: 'male', birthDate: '1999-03-12',
    },
    { resourceType: 'Practitioner', id: 'example-practitioner-triage-nurse', language: 'sv', name: [{ family: 'Berg', given: ['Anna'], text: 'Anna Berg' }] },
    {
      resourceType: 'Organization', id: 'demo-ed', name: 'Akutmottagningen (demo), Västra Götalandsregionen',
      type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/organization-type', code: 'prov', display: 'Healthcare Provider' }] }],
    },
    {
      resourceType: 'Encounter', id: 'example-encounter-emergency', language: 'sv', status: 'in-progress',
      class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'EMER', display: 'emergency' },
      subject: { reference: 'Patient/example-patient-personnummer' },
      period: { start: '2026-11-19T08:30:00+01:00' },
    },
    {
      resourceType: 'Encounter', id: 'synthetic-1-ed', language: 'sv', status: 'finished', meta: { tag: [HTEST] },
      class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'EMER', display: 'emergency' },
      subject: { reference: 'Patient/synthetic-1' },
      period: { start: '2026-10-02T21:05:00+02:00', end: '2026-10-03T02:40:00+02:00' },
    },
    ...triageSet({
      patient: 'example-patient-personnummer', encounter: 'example-encounter-emergency', prefix: 'example-', at: '2026-11-19T08:38:00+01:00',
      rr: 22, spo2: 95, o2: 0, sys: 105, dia: 70, hr: 95, acvpu: ['248234008', 'Mentally alert'], temp: 37.5,
      scores: [2, 1, 0, 1, 1, 0, 0], priority: ['2', 'Orange'], complaint: ['4', 'Bröstsmärta'],
      note: 'Bröstsmärta, pågående med misstanke om AKS.',
    }),
    ...triageSet({
      patient: 'synthetic-1', encounter: 'synthetic-1-ed', prefix: 'synthetic-1-a-', at: '2026-10-02T21:14:00+02:00',
      rr: 19, spo2: 94, o2: 0, sys: 128, dia: 74, hr: 88, acvpu: ['248234008', 'Mentally alert'], temp: 38.4,
      scores: [0, 1, 0, 0, 0, 0, 1], priority: ['3', 'Gul'], complaint: ['16', 'Infektion/feber/sepsis'],
    }),
    ...triageSet({
      patient: 'synthetic-1', encounter: 'synthetic-1-ed', prefix: 'synthetic-1-b-', at: '2026-10-02T23:02:00+02:00',
      rr: 23, spo2: 92, o2: 2, sys: 104, dia: 61, hr: 112, acvpu: ['130987000', 'Acute confusion'], temp: 39.2,
      scores: [2, 2, 2, 1, 2, 3, 2], priority: ['1', 'Röd'], complaint: ['16', 'Infektion/feber/sepsis'],
      note: 'Ny förvirring, misstänkt sepsis. Läkare tillkallad.',
    }),
  ];
}
