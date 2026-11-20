import type { Coding, Observation, Reference } from 'fhir/r4';
import { FHIR_BASE, MOCK } from './config';
import { entries, httpClient, type FhirClient } from './fhirClient';
import { lib, type LibNews2, type LibProvisional, type News2ObservationArgs, type TriageObservationArgs, type TriageParams, type TriageResult } from './libs';
import { mockClient } from './mockServer';
import { news2 as scoreNews2, type News2, type Scores } from './news2';
import { criterionPriority, loadCriteria } from './criteria';
import { PRIORITIES, RISK_PRIORITY, priorityCoding, priorityOf, type PriorityCode } from './priority';
import type { TriageAnswers } from './answers';

export type { TriageParams, TriageResult } from './libs';

/** The one FHIR client of the app (the in-browser store in mock mode). */
export const client: FhirClient = MOCK ? mockClient() : httpClient(FHIR_BASE);

/**
 * Runs the WEST-A guideline on the server (demo/lib/cds.js: PlanDefinition/$apply and
 * Library/$evaluate). Mock mode applies the same rules in the browser.
 */
export async function runTriage(params: TriageParams): Promise<TriageResult> {
  if (MOCK) return mockRunTriage(params);
  const cds = lib('cds');
  return cds.runTriage(cds.fhir(FHIR_BASE), params);
}

/** The WEST-A NEWS2 Observation (cds.js, in both modes). */
export function news2Observation(args: News2ObservationArgs): Observation {
  return lib('cds').news2Observation(args);
}

/** The WEST-A Triage Observation (cds.js, in both modes). */
export function triageObservation(args: TriageObservationArgs): Observation {
  return lib('cds').triageObservation(args);
}

const SPO2 = ['Oxygen Saturation Scale 1 Score', 'Oxygen Saturation Scale 2 Score'];

/** The NEWS2 of runTriage, keyed as the board draws it (one SpO₂ row for either scale). */
export function boardNews2(n: LibNews2, provisional?: LibProvisional): News2 {
  const scores: Scores = {};
  for (const [key, value] of Object.entries(n.scores)) {
    (scores as Record<string, number | null>)[SPO2.includes(key) ? 'Oxygen Saturation Score' : key] = value;
  }
  return {
    total: n.total,
    risk: n.risk,
    scores,
    provisional: provisional
      ? { total: provisional.total, risk: provisional.risk, missing: provisional.missing }
      : { total: n.total, risk: n.risk, missing: [] },
  };
}

/* ------------------------------------------------------------------ mock mode */

const has = (o: Observation, code: string) => !!o.code.coding?.some((c) => c.code === code);

// Mock mode reads the vitals back from the store as the CQL does (the latest of each), and
// applies the thresholds and the "most urgent of" rule of WestANEWS2.cql and WestATriage.cql.
async function mockRunTriage(p: TriageParams): Promise<TriageResult> {
  const obs = entries(
    await client.search<Observation>('Observation', {
      subject: `Patient/${p.patientId.replace(/^Patient\//, '')}`,
      _sort: '-date',
    }),
  ).filter((o) => o.status === 'final');
  const latest = (code: string) => obs.find((o) => has(o, code));
  const q = (code: string) => latest(code)?.valueQuantity?.value;
  const bp = latest('85354-9');
  const comp = (code: string) => bp?.component?.find((c) => c.code.coding?.some((k) => k.code === code))?.valueQuantity?.value;
  const answers: TriageAnswers = {
    respiratoryRate: q('9279-1'),
    oxygenSaturation: q('2708-6'),
    oxygenFlow: q('427081008'),
    systolic: comp('8480-6'),
    diastolic: comp('8462-4'),
    heartRate: q('8867-4'),
    consciousness: latest('1104441000000107')?.valueCodeableConcept?.coding?.[0],
    temperature: q('8310-5'),
    triageCriteria: [],
    scale2: !!p.scale2,
  };
  const used = ['9279-1', '2708-6', '427081008', '85354-9', '8867-4', '1104441000000107', '8310-5']
    .map(latest)
    .filter((o): o is Observation => !!o?.id)
    .map((o): Reference => ({ reference: `Observation/${o.id}` }));
  const n = scoreNews2(answers);
  const scores: Record<string, number | null> = {};
  for (const [key, value] of Object.entries(n.scores)) {
    scores[key === 'Oxygen Saturation Score' ? SPO2[p.scale2 ? 1 : 0] : key] = value ?? null;
  }

  const criteria = await loadCriteria(client);
  const codes = (p.triageCriteria ?? []).map((c) => (typeof c === 'string' ? c : c.code ?? ''));
  const symptom = codes.map((c) => criterionPriority(criteria, c)).filter((x): x is PriorityCode => !!x);
  const override = p.complaintPriority ? priorityOf(typeof p.complaintPriority === 'string' ? priorityCoding(p.complaintPriority) : p.complaintPriority) : undefined;
  const complaint = mostUrgent([...symptom, ...(override ? [override] : [])]);
  const needs = codes.some((c) => ['159', '160', '161', '162'].includes(c));
  const floor: PriorityCode | undefined = p.yellowAsLowest || needs ? '3' : undefined;
  const vital = n.risk ? RISK_PRIORITY[n.risk] : undefined;
  const proposed = vital && complaint ? mostUrgent([vital, complaint, ...(floor ? [floor] : [])]) : undefined;
  // What is known so far: the provisional NEWS2 colour, the warning symptoms and the needs
  const provisionalVital = n.provisional.risk ? RISK_PRIORITY[n.provisional.risk] : undefined;
  const provisional = mostUrgent([provisionalVital, complaint, floor].filter((x): x is PriorityCode => !!x));

  const summaries = [
    n.total === null ? 'NEWS2 not calculated: a vital parameter is missing' : `NEWS2 ${n.total}, clinical risk ${n.risk}`,
    proposed ? `Proposed WEST-A priority: ${PRIORITIES.find((x) => x.code === proposed)!.en}` : 'No proposed priority',
  ];
  await new Promise((ok) => setTimeout(ok, 800));
  return {
    news2: { total: n.total, risk: n.risk, scale2: !!p.scale2, scores, derivedFrom: used },
    proposedPriority: proposed ? priorityCoding(proposed) : null,
    vitalParameterPriority: vital ? priorityCoding(vital) : null,
    provisional: {
      total: n.provisional.total,
      risk: n.provisional.risk,
      missing: n.provisional.missing,
      priority: provisional ? priorityCoding(provisional) : null,
    },
    summaries,
  };
}

const mostUrgent = (ps: PriorityCode[]): PriorityCode | undefined => [...ps].sort()[0];

export const priorityName = (c: Coding | null | undefined) => PRIORITIES.find((p) => p.code === priorityOf(c))?.name;
