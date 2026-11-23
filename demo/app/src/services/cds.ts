import type { Coding, Observation } from 'fhir/r4';
import { BACKEND, client, guidelineEngine } from './backend';
import { lib, type LibNews2, type LibProvisional, type News2ObservationArgs, type TriageObservationArgs, type TriageParams, type TriageResult } from './libs';
import type { News2, Scores } from './news2';
import { PRIORITIES, priorityOf } from './priority';

export type { TriageParams, TriageResult } from './libs';

/** The one FHIR client of the app (services/backend.ts): a server, or the in-browser store. */
export { client };

/**
 * Runs the WEST-A guideline: on the server by PlanDefinition/$apply and Library/$evaluate
 * (demo/lib/cds.js) when it offers them, else in the browser on the guide's own CQL
 * (services/guideline.ts, loaded only then). Both give the same result.
 */
export async function runTriage(params: TriageParams): Promise<TriageResult> {
  if ((await guidelineEngine()) === 'server') {
    const cds = lib('cds');
    return { ...(await cds.runTriage(cds.fhir(BACKEND.base), params)), engine: 'server' };
  }
  const { runTriageInBrowser } = await import('./guideline');
  return runTriageInBrowser(client, params);
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

export const priorityName = (c: Coding | null | undefined) => PRIORITIES.find((p) => p.code === priorityOf(c))?.name;
