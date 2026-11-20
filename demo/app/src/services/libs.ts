import type { Bundle, Coding, Encounter, Observation, Organization, Patient, Practitioner, Questionnaire, QuestionnaireResponse, Reference } from 'fhir/r4';

// The shared modules in demo/lib (see demo/README.md), typed as this app calls them. They are
// plain ES modules without type declarations, so their types live here.

export type PriorityInput = '1' | '2' | '3' | '4' | Coding;
export type CodeInput = string | Coding;

/** news2 of runTriage: scores keyed by the CQL definitions of WestANEWS2. */
export interface LibNews2 {
  total: number | null;
  risk: 'high' | 'medium' | 'low-medium' | 'low' | null;
  scale2: boolean;
  /** 'Respiration Rate Score', 'Oxygen Saturation Scale 1 Score' or '... Scale 2 Score', ... */
  scores: Record<string, number | null>;
  /** The vital sign Observations the CQL scored. */
  derivedFrom: Reference[];
}

export interface TriageParams {
  patientId: string;
  encounterId?: string;
  practitionerId?: string;
  /** Manual override of the warning symptom priority; null leaves it out. */
  complaintPriority?: PriorityInput | null;
  /** For a client that does not pass the needs (159-162) as triage criteria; the app does. */
  yellowAsLowest?: boolean;
  scale2?: boolean;
  /** Codes or Codings of the WEST-A triage criterion code system. */
  triageCriteria?: CodeInput[];
}

/**
 * What is known so far (WestANEWS2 and WestATriage, provisional definitions): lower bounds that
 * can only rise as the vitals and warning symptoms come in, and equal the final results once
 * NEWS2 is complete and the warning symptoms are assessed.
 */
export interface LibProvisional {
  total: number | null;
  risk: LibNews2['risk'];
  /** The parameters not yet scored, by their component slices in the NEWS2 profile, in chart order. */
  missing: string[];
  /** The most urgent of what is known so far; a provisional green only means nothing more urgent is known yet. */
  priority: Coding | null;
}

export interface TriageResult {
  news2: LibNews2;
  proposedPriority: Coding | null;
  vitalParameterPriority: Coding | null;
  provisional: LibProvisional;
  summaries: string[];
  carePlan?: unknown;
}

/** The FHIR client of cds.js (only what runTriage needs). */
export interface LibClient {
  base: string;
  operation(path: string, parameters?: unknown, options?: { method?: 'GET' | 'POST' }): Promise<unknown>;
}

export interface News2ObservationArgs {
  news2: LibNews2;
  /** The provisional result of runTriage: makes a preliminary NEWS2 of the scores known so far. */
  provisional?: LibProvisional;
  patientId: string;
  encounterId?: string;
  performerId?: string;
  effectiveDateTime?: string;
  derivedFrom?: (string | Reference)[];
  id?: string;
}

export interface TriageObservationArgs {
  priority: PriorityInput;
  chiefComplaint: CodeInput;
  /** The NEWS2 Observation, or a Reference to it (a urn:uuid inside a transaction). */
  news2?: Observation | Reference | string;
  /** When given, a priority below a proposed red or orange is refused. */
  proposedPriority?: PriorityInput | null;
  /** When given, a priority below a red or orange from NEWS2 is refused. */
  vitalParameterPriority?: PriorityInput | null;
  patientId: string;
  encounterId?: string;
  performerId?: string;
  effectiveDateTime?: string;
  note?: string;
  derivedFrom?: (string | Reference)[];
  criteria?: CodeInput[];
  id?: string;
}

export interface CdsModule {
  fhir(base: string): LibClient;
  runTriage(client: LibClient, params: TriageParams): Promise<TriageResult>;
  news2Observation(args: News2ObservationArgs): Observation;
  triageObservation(args: TriageObservationArgs): Observation;
}

export interface ExtractModule {
  extractVitals(questionnaire: Questionnaire, questionnaireResponse: QuestionnaireResponse): Promise<Bundle>;
}

export interface DischargeReportArgs {
  patient: Patient;
  encounter: Encounter;
  author: Practitioner;
  organization?: Organization;
  vitals: Observation[];
  news2: Observation;
  triage: Observation;
  dischargeDate?: string;
  dischargeSummary?: string;
  language?: string;
  fhirBase?: string;
}

export interface HdrModule {
  dischargeReport(args: DischargeReportArgs): Bundle;
}

interface Modules {
  cds: CdsModule;
  extract: ExtractModule;
  hdr: HdrModule;
}

// Eager: the modules are small; extract.js loads the extraction library only when called.
const modules = import.meta.glob(['../../../lib/extract.js', '../../../lib/cds.js', '../../../lib/hdr.js'], { eager: true });

export function lib<K extends keyof Modules>(name: K): Modules[K] {
  const module = modules[`../../../lib/${name}.js`];
  if (!module) throw new Error(`demo/lib/${name}.js is not in this build. Add it and restart Vite.`);
  return module as Modules[K];
}

/** A local id for a resource inside a transaction or document Bundle. */
export const uuid = () => `urn:uuid:${crypto.randomUUID()}`;
