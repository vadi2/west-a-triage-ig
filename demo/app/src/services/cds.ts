import type { Coding, Observation, Reference, Resource } from 'fhir/r4';
import { FHIR_BASE, MOCK, profile } from './config';
import { entries, httpClient, type FhirClient } from './fhirClient';
import { loadLib } from './libs';
import { mockClient } from './mockServer';
import { news2 as scoreNews2, type News2, type ScoreKey } from './news2';
import { PRIORITIES, RISK_PRIORITY, RISK_TEXT, priorityCoding, priorityOf, type PriorityCode } from './priority';
import type { TriageAnswers } from './answers';

export interface TriageParams {
  patientId: string;
  encounterId: string;
  /** The most urgent warning symptom of the complaint algorithm; 4 (Grön) when none. */
  complaintPriority: Coding | null;
  yellowAsLowest: boolean;
  scale2: boolean;
}

export interface TriageResult {
  news2: News2;
  proposedPriority: Coding | null;
  summaries: string[];
  carePlan?: Resource;
}

export interface News2ObservationArgs {
  news2: News2;
  patientId: string;
  encounterId: string;
  practitionerId: string;
  /** The vital sign Observations the score comes from; they become `derivedFrom`. */
  vitals: Reference[];
  scale2: boolean;
  effectiveDateTime: string;
}

export interface TriageObservationArgs {
  priority: Coding;
  chiefComplaint: Coding;
  /** The NEWS2 Observation (may be a urn:uuid inside the same transaction). */
  news2: Reference;
  patientId: string;
  encounterId: string;
  practitionerId: string;
  effectiveDateTime: string;
  note?: string;
}

/** demo/lib/cds.js, as this app calls it. */
export interface CdsModule {
  fhir(base: string): FhirClient;
  runTriage(client: FhirClient, params: TriageParams): Promise<TriageResult>;
  news2Observation(args: News2ObservationArgs): Observation;
  triageObservation(args: TriageObservationArgs): Observation;
}

/** The one FHIR client of the app. */
export const client: FhirClient = MOCK ? mockClient() : httpClient(FHIR_BASE);

export async function runTriage(params: TriageParams): Promise<TriageResult> {
  if (MOCK) return mockRunTriage(params);
  const cds = await loadLib<CdsModule>('cds');
  return cds.runTriage(client, params);
}

export async function news2Observation(args: News2ObservationArgs): Promise<Observation> {
  if (MOCK) return mockNews2Observation(args);
  return (await loadLib<CdsModule>('cds')).news2Observation(args);
}

export async function triageObservation(args: TriageObservationArgs): Promise<Observation> {
  if (MOCK) return mockTriageObservation(args);
  return (await loadLib<CdsModule>('cds')).triageObservation(args);
}

/* ------------------------------------------------------------------ mock mode */

// Mock mode reads the vitals back from the store like the CQL does (latest of each), then
// applies the same thresholds and the same "most urgent of" rule as WestATriage.cql.
async function mockRunTriage(p: TriageParams): Promise<TriageResult> {
  const obs = entries(await client.search<Observation>('Observation', { subject: `Patient/${p.patientId}`, encounter: `Encounter/${p.encounterId}`, _sort: '-date' }));
  const latest = (code: string) => obs.find((o) => o.status === 'final' && o.code.coding?.some((c) => c.code === code));
  const q = (code: string) => latest(code)?.valueQuantity?.value;
  const bp = latest('85354-9')?.component;
  const comp = (code: string) => bp?.find((c) => c.code.coding?.some((k) => k.code === code))?.valueQuantity?.value;
  const acvpu = latest('1104441000000107')?.valueCodeableConcept?.coding?.[0];
  const answers: TriageAnswers = {
    respiratoryRate: q('9279-1'),
    oxygenSaturation: q('2708-6'),
    oxygenFlow: q('427081008'),
    systolic: comp('8480-6'),
    diastolic: comp('8462-4'),
    heartRate: q('8867-4'),
    consciousness: acvpu,
    temperature: q('8310-5'),
    frailElderly: false,
    likelyAdmission: false,
    violenceOrAssault: false,
    scale2: p.scale2,
  };
  const n = scoreNews2(answers);
  const vital = n.risk ? RISK_PRIORITY[n.risk] : undefined;
  const complaint = priorityOf(p.complaintPriority);
  const floor: PriorityCode | undefined = p.yellowAsLowest ? '3' : undefined;
  const proposed =
    vital && complaint ? ([vital, complaint, floor].filter(Boolean) as PriorityCode[]).sort()[0] : undefined;
  const summaries = [
    n.total === null ? 'NEWS2 not calculated: a vital parameter is missing' : `NEWS2 ${n.total}, clinical risk ${n.risk}`,
    proposed ? `Proposed WEST-A priority: ${PRIORITIES.find((x) => x.code === proposed)!.en}` : 'No proposed priority',
  ];
  await new Promise((ok) => setTimeout(ok, 500));
  return { news2: n, proposedPriority: proposed ? priorityCoding(proposed) : null, summaries };
}

const SCT = 'http://snomed.info/sct';
const NEWS2_COMPONENT: Record<ScoreKey, { code: string; display: string }> = {
  'Respiration Rate Score': { code: '1104301000000104', display: 'Royal College of Physicians NEWS2 (National Early Warning Score 2) - respiration rate score' },
  'Oxygen Saturation Score': { code: '1104311000000102', display: 'Royal College of Physicians NEWS2 (National Early Warning Score 2) - oxygen saturation scale 1 score' },
  'Supplemental Oxygen Score': { code: '1104331000000105', display: 'Royal College of Physicians NEWS2 (National Early Warning Score 2) - air or oxygen score' },
  'Systolic Blood Pressure Score': { code: '1104341000000101', display: 'Royal College of Physicians NEWS2 (National Early Warning Score 2) - systolic blood pressure score' },
  'Pulse Score': { code: '1104351000000103', display: 'Royal College of Physicians NEWS2 (National Early Warning Score 2) - pulse score' },
  'Consciousness Score': { code: '1104361000000100', display: 'Royal College of Physicians NEWS2 (National Early Warning Score 2) - consciousness score' },
  'Temperature Score': { code: '1104371000000107', display: 'Royal College of Physicians NEWS2 (National Early Warning Score 2) - temperature score' },
};
const SCALE2 = { code: '1104321000000108', display: 'Royal College of Physicians NEWS2 (National Early Warning Score 2) - oxygen saturation scale 2 score' };

function context(a: { patientId: string; encounterId: string; practitionerId: string; effectiveDateTime: string }) {
  return {
    status: 'final' as const,
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey', display: 'Survey' }] }],
    subject: { reference: `Patient/${a.patientId}` },
    encounter: { reference: `Encounter/${a.encounterId}` },
    performer: [{ reference: `Practitioner/${a.practitionerId}` }],
    effectiveDateTime: a.effectiveDateTime,
  };
}

function mockNews2Observation(a: News2ObservationArgs): Observation {
  return {
    resourceType: 'Observation',
    meta: { profile: [profile('west-a-news2-observation')] },
    ...context(a),
    code: { coding: [{ system: SCT, code: '1104051000000101', display: 'Royal College of Physicians NEWS2 (National Early Warning Score 2) total score' }] },
    valueInteger: a.news2.total ?? undefined,
    interpretation: a.news2.risk ? [{ text: `Clinical risk ${RISK_TEXT[a.news2.risk]}` }] : undefined,
    derivedFrom: a.vitals,
    component: (Object.keys(NEWS2_COMPONENT) as ScoreKey[])
      .filter((k) => typeof a.news2.scores[k] === 'number')
      .map((k) => {
        const c = k === 'Oxygen Saturation Score' && a.scale2 ? SCALE2 : NEWS2_COMPONENT[k];
        return { code: { coding: [{ system: SCT, ...c }] }, valueInteger: a.news2.scores[k]! };
      }),
  };
}

function mockTriageObservation(a: TriageObservationArgs): Observation {
  return {
    resourceType: 'Observation',
    meta: { profile: [profile('west-a-triage-observation')] },
    ...context(a),
    code: { coding: [{ system: SCT, code: '425705009', display: 'Determination of acuity level' }] },
    valueCodeableConcept: { coding: [a.priority] },
    derivedFrom: [a.news2],
    component: [
      {
        code: { coding: [{ system: SCT, code: '1269489004', display: 'Chief complaint' }] },
        valueCodeableConcept: { coding: [a.chiefComplaint] },
      },
    ],
    note: a.note ? [{ text: a.note }] : undefined,
  };
}

