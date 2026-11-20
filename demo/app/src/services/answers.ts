import type { Coding, QuestionnaireResponse, QuestionnaireResponseItem, QuestionnaireResponseItemAnswer } from 'fhir/r4';

/** The answers of the triage form, by the linkIds of the Questionnaire contract (demo/README.md). */
export interface TriageAnswers {
  respiratoryRate?: number;
  oxygenSaturation?: number;
  oxygenFlow?: number;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  consciousness?: Coding;
  temperature?: number;
  chiefComplaint?: Coding;
  /** Every answer of the items whose linkId starts with triage-criteria: the warning
   * symptoms, "No warning symptoms" (163) and the needs and processes (159-162), which
   * give yellow as the lowest priority. */
  triageCriteria: Coding[];
  /** Optional manual override of the warning symptom priority. */
  complaintPriority?: Coding;
  scale2: boolean;
}

function findAnswer(items: QuestionnaireResponseItem[] | undefined, linkId: string): QuestionnaireResponseItemAnswer | undefined {
  for (const item of items ?? []) {
    if (item.linkId === linkId) return item.answer?.[0];
    const nested =
      findAnswer(item.item, linkId) ?? findAnswer(item.answer?.flatMap((a) => a.item ?? []), linkId);
    if (nested) return nested;
  }
  return undefined;
}

function collectCriteria(items: QuestionnaireResponseItem[] | undefined, out: Coding[] = []): Coding[] {
  for (const item of items ?? []) {
    if (item.linkId.startsWith('triage-criteria')) {
      for (const a of item.answer ?? []) if (a.valueCoding) out.push(a.valueCoding);
    }
    collectCriteria(item.item, out);
    collectCriteria(item.answer?.flatMap((a) => a.item ?? []), out);
  }
  return out;
}

const num = (a?: QuestionnaireResponseItemAnswer) => a?.valueInteger ?? a?.valueDecimal ?? a?.valueQuantity?.value;

export function readAnswers(qr: QuestionnaireResponse | undefined): TriageAnswers {
  const a = (id: string) => findAnswer(qr?.item, id);
  return {
    respiratoryRate: num(a('respiratory-rate')),
    oxygenSaturation: num(a('oxygen-saturation')),
    oxygenFlow: num(a('oxygen-flow')),
    systolic: num(a('systolic')),
    diastolic: num(a('diastolic')),
    heartRate: num(a('heart-rate')),
    consciousness: a('consciousness')?.valueCoding,
    temperature: num(a('temperature')),
    chiefComplaint: a('chief-complaint')?.valueCoding,
    triageCriteria: collectCriteria(qr?.item),
    complaintPriority: a('complaint-priority')?.valueCoding,
    scale2: a('oxygen-scale-2')?.valueBoolean === true,
  };
}

