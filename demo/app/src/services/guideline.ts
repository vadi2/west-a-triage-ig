import cql from 'cql-execution';
import * as cqlfhirModule from 'cql-exec-fhir';
import type { ActivityDefinition, Bundle, CarePlan, Coding, FhirResource, Observation, Patient, PlanDefinition, PlanDefinitionAction, Reference, RequestGroup, RequestGroupAction, Task } from 'fhir/r4';
import { entries, type FhirClient } from './fhirClient';
import { lib, type TriageParams, type TriageResult } from './libs';
// As text: the ELM is too large for TypeScript to type as a JSON module
import FHIRHelpers from '../fixtures/guideline/elm/FHIRHelpers.json?raw';
import WestANEWS2 from '../fixtures/guideline/elm/WestANEWS2.json?raw';
import WestATriage from '../fixtures/guideline/elm/WestATriage.json?raw';
import triagePlan from '../fixtures/guideline/PlanDefinition-west-a-triage.json';
import news2Plan from '../fixtures/guideline/PlanDefinition-west-a-news2-calculation.json';
import recordNews2 from '../fixtures/guideline/ActivityDefinition-west-a-record-news2.json';
import recordPriority from '../fixtures/guideline/ActivityDefinition-west-a-record-triage-priority.json';

/*
 * The WEST-A guideline in the browser: the ELM of the guide's CQL Libraries (WestANEWS2,
 * WestATriage, FHIRHelpers), as the IG Publisher translated it, run by the CQL execution
 * engine (cql-execution, cql-exec-fhir) on the patient's vital signs read from the FHIR store.
 * The result has the shape of demo/lib/cds.js runTriage, which asks a server for the same by
 * PlanDefinition/$apply and Library/$evaluate; the CarePlan is built here from the guide's
 * PlanDefinitions and ActivityDefinitions as $apply does. The files come from the built IG
 * (scripts/ig-assets.mjs). This module is loaded only when the browser runs the guideline.
 */

type Elm = { library: { identifier: { id: string }; parameters?: { def?: { name: string; parameterTypeSpecifier?: { name?: string } }[] }; codes?: { def?: { name: string; id: string; codeSystem: { name: string } }[] }; codeSystems?: { def?: { name: string; id: string }[] } } };

// A CommonJS module: its exports are the default export once bundled
const cqlfhir = ((cqlfhirModule as unknown as { default?: typeof cqlfhirModule }).default ?? cqlfhirModule) as typeof cqlfhirModule;

const ELM: Record<string, Elm> = { FHIRHelpers: JSON.parse(FHIRHelpers), WestANEWS2: JSON.parse(WestANEWS2), WestATriage: JSON.parse(WestATriage) };
const repository = new cql.Repository(ELM);
const LIBRARIES = {
  WestANEWS2: new cql.Library(ELM.WestANEWS2, repository),
  WestATriage: new cql.Library(ELM.WestATriage, repository),
};
type LibraryName = keyof typeof LIBRARIES;

const KNOWLEDGE = new Map<string, PlanDefinition | ActivityDefinition>(
  ([triagePlan, news2Plan, recordNews2, recordPriority] as (PlanDefinition | ActivityDefinition)[]).map((r) => [r.url!, r]),
);

const IG = 'https://vadi2.github.io/west-a-triage-ig';
const PRIORITY_SYSTEM = `${IG}/CodeSystem/west-a-triage-priority-cs`;
const CRITERION_SYSTEM = `${IG}/CodeSystem/west-a-triage-criterion-cs`;
const BOOLEAN = '{urn:hl7-org:elm-types:r1}Boolean';

// The NEWS2 parameter scores and the vital sign observations, as in cds.js
const SCORES = [
  'Respiration Rate Score',
  'Oxygen Saturation Scale 1 Score',
  'Oxygen Saturation Scale 2 Score',
  'Supplemental Oxygen Score',
  'Systolic Blood Pressure Score',
  'Pulse Score',
  'Consciousness Score',
  'Temperature Score',
];
const OBSERVATIONS = [
  'Respiration Rate Observation',
  'Oxygen Saturation Observation',
  'Supplemental Oxygen Observation',
  'Blood Pressure Observation',
  'Heart Rate Observation',
  'Consciousness Observation',
  'Body Temperature Observation',
];

// The codes WestANEWS2 declares (the vital signs it retrieves, among others), for the search
const CODES = (() => {
  const elm = ELM.WestANEWS2.library;
  const systems = new Map((elm.codeSystems?.def ?? []).map((s) => [s.name, s.id]));
  return (elm.codes?.def ?? []).map((c) => `${systems.get(c.codeSystem.name)}|${c.id}`).join(',');
})();

type Results = Record<string, unknown>;

/** A CQL result as plain JSON: a Code as a Coding, a FHIR object as its resource. */
function plain(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) return v.map(plain);
  if (v instanceof cql.Code) return { system: v.system, code: v.code, ...(v.display ? { display: v.display } : {}) };
  if (typeof v === 'object' && '_json' in (v as object)) return (v as { _json: unknown })._json;
  return v;
}

const codeOf = (c: TriageParams['complaintPriority'] | string, system: string) => {
  if (c === null || c === undefined || c === '') return null;
  return typeof c === 'string' ? new cql.Code(c, system) : new cql.Code(c.code!, c.system ?? system);
};

// The CQL parameters of a library. Each declared one is passed: cql-execution ignores a
// default and returns the definition itself for a parameter left out, so a Boolean is false
// and anything else null when not given (as .github/tests/cql/run.mjs does).
function parameters(name: LibraryName, p: TriageParams) {
  const given: Record<string, unknown> = {
    'Complaint Priority': codeOf(p.complaintPriority, PRIORITY_SYSTEM),
    'Yellow As Lowest Priority': !!p.yellowAsLowest,
    'Use Oxygen Saturation Scale 2': !!p.scale2,
    // Left out when none, as cds.js does: the warning symptoms are then not yet assessed
    'Triage Criteria': p.triageCriteria?.length ? p.triageCriteria.map((c) => codeOf(c, CRITERION_SYSTEM)) : null,
  };
  const out: Record<string, unknown> = {};
  for (const d of ELM[name].library.parameters?.def ?? []) {
    out[d.name] = given[d.name] ?? (d.parameterTypeSpecifier?.name === BOOLEAN ? false : null);
  }
  return out;
}

async function evaluate(name: LibraryName, bundle: Bundle, patientId: string, p: TriageParams, now: Date): Promise<Results> {
  const source = cqlfhir.PatientSource.FHIRv401();
  source.loadBundles([bundle]);
  const executor = new cql.Executor(LIBRARIES[name], new cql.CodeService({}), parameters(name, p));
  const results = await executor.exec(source, cql.DateTime.fromJSDate(now));
  const r = results.patientResults[patientId];
  if (!r) throw new Error(`The CQL engine gave no results for Patient/${patientId}`);
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, plain(v)]));
}

/* ------------------------------------------------------------------ $apply */

const libraryOf = (r: PlanDefinition | ActivityDefinition): LibraryName => {
  const name = r.library?.[0]?.split('|')[0].split('/').pop();
  if (name !== 'WestANEWS2' && name !== 'WestATriage') throw new Error(`${r.resourceType}/${r.id}: no library this app runs (${r.library?.[0]})`);
  return name;
};

function identifier(expression: { language?: string; expression?: string } | undefined, library: LibraryName, results: Record<LibraryName, Results>) {
  if (expression?.language !== 'text/cql-identifier' || !expression.expression) {
    throw new Error(`Only text/cql-identifier expressions are evaluated here, not ${expression?.language}`);
  }
  if (!(expression.expression in results[library])) throw new Error(`${library} defines no "${expression.expression}"`);
  return results[library][expression.expression];
}

/**
 * PlanDefinition/$apply, as far as the WEST-A PlanDefinitions use it: an action applies when
 * its applicability conditions (CQL identifiers in the plan's library) are true; a
 * PlanDefinition it points to becomes a nested RequestGroup, an ActivityDefinition a Task with
 * its dynamic values. Every applicable child action is kept, as HAPI does; the caller checks
 * that one priority is proposed.
 */
function apply(plan: PlanDefinition, results: Record<LibraryName, Results>, subject: Reference): CarePlan {
  const contained: FhirResource[] = [];

  function actions(list: PlanDefinitionAction[] | undefined, lib: LibraryName): RequestGroupAction[] {
    const out: RequestGroupAction[] = [];
    for (const a of list ?? []) {
      const applies = (a.condition ?? []).filter((c) => c.kind === 'applicability').every((c) => identifier(c.expression, lib, results) === true);
      if (!applies) continue;
      const action: RequestGroupAction = {
        ...(a.id ? { id: a.id } : {}),
        ...(a.title ? { title: a.title } : {}),
        ...(a.description ? { description: a.description } : {}),
        ...(a.code ? { code: a.code } : {}),
        ...(a.relatedAction ? { relatedAction: a.relatedAction } : {}),
        ...(a.selectionBehavior ? { selectionBehavior: a.selectionBehavior } : {}),
      };
      const target = a.definitionCanonical ? KNOWLEDGE.get(a.definitionCanonical.split('|')[0]) : undefined;
      if (a.definitionCanonical && !target) throw new Error(`${a.definitionCanonical} is not among the guide's knowledge artifacts in this build`);
      if (target?.resourceType === 'PlanDefinition') action.resource = { reference: `#${group(target)}` };
      if (target?.resourceType === 'ActivityDefinition') action.resource = { reference: `#${task(target)}` };
      const children = actions(a.action, lib);
      if (children.length) action.action = children;
      out.push(action);
    }
    return out;
  }

  function group(pd: PlanDefinition): string {
    const id = `${pd.id}-${contained.length}`;
    const rg: RequestGroup = {
      resourceType: 'RequestGroup',
      id,
      instantiatesCanonical: [`${pd.url}|${pd.version}`],
      status: 'draft',
      intent: 'proposal',
      subject,
    };
    contained.push(rg);
    const a = actions(pd.action, libraryOf(pd));
    if (a.length) rg.action = a;
    return id;
  }

  function task(ad: ActivityDefinition): string {
    const id = `${ad.id}-${contained.length}`;
    const t: Task = {
      resourceType: 'Task',
      id,
      instantiatesCanonical: `${ad.url}|${ad.version}`,
      status: 'draft',
      intent: (ad.intent as Task['intent']) ?? 'proposal',
      ...(ad.code ? { code: ad.code } : {}),
      for: subject,
    };
    for (const dv of ad.dynamicValue ?? []) {
      const value = identifier(dv.expression, libraryOf(ad), results);
      if (dv.path === 'description' && typeof value === 'string') t.description = value;
    }
    contained.push(t);
    return id;
  }

  const root = group(plan);
  return {
    resourceType: 'CarePlan',
    contained,
    instantiatesCanonical: [`${plan.url}|${plan.version}`],
    status: 'draft',
    intent: 'proposal',
    subject,
    activity: [{ reference: { reference: `#${root}` } }],
  };
}

// The Task descriptions in the order of the actions, and the priorities proposed (the
// applicable actions under propose-priority), as cds.js reads the CarePlan of $apply
function walk(carePlan: CarePlan) {
  const contained = new Map((carePlan.contained ?? []).map((r) => [`#${r.id}`, r]));
  const summaries: string[] = [];
  const proposed: Coding[] = [];
  const visit = (actions: RequestGroupAction[] | undefined, parent?: string) => {
    for (const a of actions ?? []) {
      const coding = a.code?.flatMap((c) => c.coding ?? []).find((c) => c.system === PRIORITY_SYSTEM);
      if (coding && parent === 'propose-priority') proposed.push(coding);
      const target = contained.get(a.resource?.reference ?? '');
      if (target?.resourceType === 'RequestGroup') visit((target as RequestGroup).action);
      else if (target?.resourceType === 'Task' && (target as Task).description) summaries.push((target as Task).description!);
      visit(a.action, a.id ?? parent);
    }
  };
  const root = contained.get(carePlan.activity?.[0]?.reference?.reference ?? '') as RequestGroup | undefined;
  visit(root?.action);
  return { summaries, proposed };
}

/* ------------------------------------------------------------------ runTriage */

// The time of an observation as WestANEWS2's "Effective Time": the date-time or instant, or
// the end (else the start) of the period
const effective = (o: Observation) =>
  o.effectiveDateTime ?? o.effectiveInstant ?? o.effectivePeriod?.end ?? o.effectivePeriod?.start;

/** Whether an observation was measured at or after the given time (always, without one). */
function measuredSince(o: Observation, since: string | undefined): boolean {
  if (!since) return true;
  const t = Date.parse(effective(o) ?? '');
  return !Number.isNaN(t) && t >= Date.parse(since);
}

/**
 * runTriage of demo/lib/cds.js, in the browser: the same parameters, the same result.
 * Reads the patient and the vital sign Observations from the store (a vanished patient fails
 * with the store's 404 or 410).
 */
export async function runTriageInBrowser(client: FhirClient, p: TriageParams): Promise<TriageResult> {
  const patientId = p.patientId.replace(/^Patient\//, '');
  const subject = { reference: `Patient/${patientId}` };
  const [patient, found] = await Promise.all([
    client.read<Patient>('Patient', patientId),
    client.search<Observation>('Observation', { subject: subject.reference, code: CODES, _sort: '-date', _count: '200' }),
  ]);
  const bundle: Bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [patient, ...entries(found).filter((o) => measuredSince(o, p.measuredSince))].map((resource) => ({ resource })),
  };
  const now = new Date();
  const [n, t] = await Promise.all([
    evaluate('WestANEWS2', bundle, patientId, p, now),
    evaluate('WestATriage', bundle, patientId, p, now),
  ]);
  const results = { WestANEWS2: n, WestATriage: t };

  const cds = lib('cds');
  const unused = p.scale2 ? 'Oxygen Saturation Scale 1 Score' : 'Oxygen Saturation Scale 2 Score';
  const scores = Object.fromEntries(SCORES.filter((s) => s !== unused).map((s) => [s, (n[s] as number | null) ?? null]));
  const derivedFrom = OBSERVATIONS.map((e) => n[e] as Observation | null)
    .filter((o): o is Observation => o?.resourceType === 'Observation' && !!o.id)
    .map((o) => ({ reference: `Observation/${o.id}` }));

  const carePlan = apply(triagePlan as PlanDefinition, results, subject);
  const { summaries, proposed } = walk(carePlan);
  if (proposed.length > 1) throw new Error(`The PlanDefinition proposed ${proposed.length} priorities, expected at most one`);
  const proposedPriority = proposed.length ? cds.priorityCoding(proposed[0]) : null;
  const evaluated = t['Proposed Priority'] ? cds.priorityCoding(t['Proposed Priority'] as Coding) : null;
  if ((proposedPriority?.code ?? null) !== (evaluated?.code ?? null)) {
    throw new Error(`The PlanDefinition proposed ${proposedPriority?.code ?? 'nothing'}, but WestATriage evaluates to ${evaluated?.code ?? 'nothing'}`);
  }
  const coding = (v: unknown) => (v ? cds.priorityCoding(v as Coding) : null);

  return {
    news2: {
      total: (n['NEWS2 Total Score'] as number | null) ?? null,
      risk: (n['NEWS2 Clinical Risk'] as TriageResult['news2']['risk']) ?? null,
      scale2: !!p.scale2,
      scores,
      derivedFrom,
    },
    proposedPriority,
    vitalParameterPriority: coding(t['Vital Parameter Priority']),
    provisional: {
      total: (n['Provisional NEWS2 Total Score'] as number | null) ?? null,
      risk: (n['Provisional NEWS2 Clinical Risk'] as TriageResult['news2']['risk']) ?? null,
      missing: ((n['NEWS2 Missing Parameters'] as string[] | null) ?? []).filter((x) => x !== null),
      priority: coding(t['Provisional Proposed Priority']),
    },
    summaries,
    carePlan,
    engine: 'browser',
  };
}
