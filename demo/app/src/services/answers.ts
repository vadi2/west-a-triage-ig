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
  complaintPriority?: Coding;
  frailElderly: boolean;
  likelyAdmission: boolean;
  violenceOrAssault: boolean;
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
    complaintPriority: a('complaint-priority')?.valueCoding,
    frailElderly: a('frail-elderly')?.valueBoolean === true,
    likelyAdmission: a('likely-admission')?.valueBoolean === true,
    violenceOrAssault: a('violence-or-assault')?.valueBoolean === true,
    scale2: a('oxygen-scale-2')?.valueBoolean === true,
  };
}

export const yellowAsLowest = (a: TriageAnswers) => a.frailElderly || a.likelyAdmission || a.violenceOrAssault;
