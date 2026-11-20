import type { Coding, QuestionnaireResponse, QuestionnaireResponseItem } from 'fhir/r4';
import { CRITERION_SYSTEM, NEED_CODES, NO_WARNING_SYMPTOMS } from './criteria';
import { IG } from './config';
import { ACVPU } from './news2';
import type { PriorityCode } from './priority';

/*
 * Sample data for a presenter: invented values only, never a real patient. The triage
 * scenarios each give one WEST-A outcome under the guideline's rules (the NEWS2 chart of
 * WestANEWS2.cql and the priority property of the triage criterion code system); the free
 * texts say in their first words that they are synthetic.
 */

export interface Vitals {
  respiratoryRate: number;
  oxygenSaturation: number;
  /** Litres per minute; 0 is room air. */
  oxygenFlow: number;
  systolic: number;
  diastolic: number;
  heartRate: number;
  /** ACVPU letter. */
  consciousness: 'A' | 'C' | 'V' | 'P' | 'U';
  temperature: number;
}

export interface TriageScenario {
  id: string;
  /** The button text. */
  label: string;
  /** What the scenario shows, with the NEWS2 and priority the guideline gives. */
  title: string;
  news2?: number;
  /** The proposed priority; none when the presenter still has to pick the complaint. */
  priority?: PriorityCode;
  /** All seven parameters, or some of them to show the provisional NEWS2. */
  vitals: Partial<Vitals>;
  complaint?: { code: string; display: string; criteria: Coding[] };
}

const criterion = (code: string, display: string): Coding => ({ system: CRITERION_SYSTEM, code, display });
const NONE = criterion(NO_WARNING_SYMPTOMS, 'No warning symptoms');

export const TRIAGE_SCENARIOS: TriageScenario[] = [
  {
    id: 'rod',
    label: 'Röd · sepsis',
    title: 'Suspected infection with NEWS2 14 (high risk) and the red warning symptom 74: Röd',
    news2: 14,
    priority: '1',
    // RR 26 (3), SpO₂ 91 (3), air (0), BP 95 (2), pulse 125 (2), new confusion (3), 38.9 °C (1)
    vitals: { respiratoryRate: 26, oxygenSaturation: 91, oxygenFlow: 0, systolic: 95, diastolic: 55, heartRate: 125, consciousness: 'C', temperature: 38.9 },
    complaint: { code: '16', display: 'Infektion/feber/sepsis', criteria: [criterion('74', 'Infection: suspected, with NEWS2 ≥7')] },
  },
  {
    id: 'orange',
    label: 'Orange · chest pain',
    title: 'The guide’s example: NEWS2 5 (medium risk) and the orange warning symptom 15: Orange',
    news2: 5,
    priority: '2',
    // RR 22 (2), SpO₂ 95 (1), air (0), BP 105 (1), pulse 95 (1), alert (0), 37.5 °C (0)
    vitals: { respiratoryRate: 22, oxygenSaturation: 95, oxygenFlow: 0, systolic: 105, diastolic: 70, heartRate: 95, consciousness: 'A', temperature: 37.5 },
    complaint: {
      code: '4',
      display: 'Bröstsmärta',
      criteria: [criterion('15', 'Ongoing chest pain with suspected acute coronary syndrome or another serious cause')],
    },
  },
  {
    id: 'gul',
    label: 'Gul · vomiting',
    title: 'NEWS2 2 (low risk, Grön) and the yellow warning symptom 20: Gul',
    news2: 2,
    priority: '3',
    // RR 18 (0), SpO₂ 97 (0), air (0), BP 118 (0), pulse 112 (2), alert (0), 37.8 °C (0)
    vitals: { respiratoryRate: 18, oxygenSaturation: 97, oxygenFlow: 0, systolic: 118, diastolic: 74, heartRate: 112, consciousness: 'A', temperature: 37.8 },
    complaint: { code: '7', display: 'Diarré/kräkningar', criteria: [criterion('20', 'Vomiting: ongoing')] },
  },
  {
    id: 'gron',
    label: 'Grön · limb',
    title: 'NEWS2 0 (low risk) and no warning symptoms (163): Grön',
    news2: 0,
    priority: '4',
    vitals: { respiratoryRate: 14, oxygenSaturation: 98, oxygenFlow: 0, systolic: 128, diastolic: 78, heartRate: 72, consciousness: 'A', temperature: 36.8 },
    complaint: { code: '9', display: 'Extremitetsproblem', criteria: [NONE] },
  },
  {
    id: 'need',
    label: 'Grön + need → Gul',
    title: 'NEWS2 1 (low risk) and no warning symptoms, but frail elderly (need 159) makes Gul the lowest: Gul',
    news2: 1,
    priority: '3',
    // RR 18 (0), SpO₂ 96 (0), air (0), BP 142 (0), pulse 84 (0), alert (0), 36.0 °C (1)
    vitals: { respiratoryRate: 18, oxygenSaturation: 96, oxygenFlow: 0, systolic: 142, diastolic: 86, heartRate: 84, consciousness: 'A', temperature: 36.0 },
    complaint: { code: '23', display: 'Ospecifik sjukdom', criteria: [NONE, criterion('159', 'Frail elderly by screening (FRESH)')] },
  },
  {
    id: 'vitals',
    label: 'Vitals only',
    title: 'NEWS2 0: the vital signs only. Pick the chief complaint and its warning symptoms yourself',
    news2: 0,
    vitals: { respiratoryRate: 16, oxygenSaturation: 97, oxygenFlow: 0, systolic: 132, diastolic: 84, heartRate: 78, consciousness: 'A', temperature: 37.1 },
  },
  {
    id: 'partial',
    label: 'Partial vitals',
    title: 'Respiration rate, SpO₂ and pulse only: NEWS2 at least 6 so far, at least Orange, which already holds. Save the vitals so far, then add the rest',
    // RR 24 (2), SpO₂ 93 (2), pulse 118 (2): provisional 6, medium
    vitals: { respiratoryRate: 24, oxygenSaturation: 93, heartRate: 118 },
  },
];

const SCT = 'http://snomed.info/sct';
const SCT_SE = 'http://snomed.info/sct/45991000052106';

/** A triage scenario as a QuestionnaireResponse for the renderer. */
export function scenarioResponse(s: TriageScenario): QuestionnaireResponse {
  const v = s.vitals;
  const acvpu = ACVPU.find((a) => a.letter === v.consciousness);
  const assessment: QuestionnaireResponseItem[] = [];
  if (s.complaint) {
    const none = s.complaint.criteria.filter((c) => c.code === NO_WARNING_SYMPTOMS);
    const needs = s.complaint.criteria.filter((c) => NEED_CODES.includes(c.code!));
    const symptoms = s.complaint.criteria.filter((c) => !none.includes(c) && !needs.includes(c));
    assessment.push(
      { linkId: 'chief-complaint', answer: [{ valueCoding: { system: `${IG}/CodeSystem/west-a-chief-complaint-cs`, code: s.complaint.code, display: s.complaint.display } }] },
      {
        linkId: 'triage-criteria',
        item: [
          ...(symptoms.length ? [{ linkId: `triage-criteria-${s.complaint.code}`, answer: symptoms.map((valueCoding) => ({ valueCoding })) }] : []),
          ...(none.length ? [{ linkId: 'triage-criteria-none', answer: none.map((valueCoding) => ({ valueCoding })) }] : []),
          ...(needs.length ? [{ linkId: 'triage-criteria-needs', answer: needs.map((valueCoding) => ({ valueCoding })) }] : []),
        ],
      },
    );
  }
  assessment.push({ linkId: 'oxygen-scale-2', answer: [{ valueBoolean: false }] });
  return {
    resourceType: 'QuestionnaireResponse',
    status: 'in-progress',
    item: [
      {
        linkId: 'vitals',
        item: (
          [
            v.respiratoryRate !== undefined && { linkId: 'respiratory-rate', answer: [{ valueInteger: v.respiratoryRate }] },
            v.oxygenSaturation !== undefined && { linkId: 'oxygen-saturation', answer: [{ valueInteger: v.oxygenSaturation }] },
            v.oxygenFlow !== undefined && { linkId: 'oxygen-flow', answer: [{ valueDecimal: v.oxygenFlow }] },
            v.systolic !== undefined && { linkId: 'systolic', answer: [{ valueInteger: v.systolic }] },
            v.diastolic !== undefined && { linkId: 'diastolic', answer: [{ valueInteger: v.diastolic }] },
            v.heartRate !== undefined && { linkId: 'heart-rate', answer: [{ valueInteger: v.heartRate }] },
            acvpu && { linkId: 'consciousness', answer: [{ valueCoding: { system: SCT, version: SCT_SE, code: acvpu.code, display: acvpu.display } }] },
            v.temperature !== undefined && { linkId: 'temperature', answer: [{ valueDecimal: v.temperature }] },
          ] as (QuestionnaireResponseItem | false)[]
        ).filter((i): i is QuestionnaireResponseItem => !!i),
      },
      { linkId: 'assessment', item: assessment },
    ],
  };
}

/** A sample note on the clinical assessment, in Swedish, for raising, lowering or keeping the proposal. */
export function sampleAssessmentNote(change: 'raised' | 'lowered' | 'kept'): string {
  const lead = 'Syntetisk exempeltext.';
  switch (change) {
    case 'raised':
      return `${lead} Patienten ser mer påverkad ut än parametrarna visar: blek, kallsvettig och orolig. Höjer prioriteten för snabbare läkarbedömning.`;
    case 'lowered':
      return `${lead} Känd sedan tidigare med samma värden enligt journal, opåverkad och ger ett stabilt intryck. Sänker prioriteten efter samråd med jourhavande läkare.`;
    case 'kept':
      return `${lead} Klinisk bedömning stämmer med föreslagen prioritet. Opåverkad, sitter i väntrummet med anhörig.`;
  }
}

/** A sample hospital course for the discharge report, in Swedish, by the recorded priority. */
export function sampleDischargeSummary(priority: PriorityCode | undefined): string {
  const lead = 'Syntetisk exempeltext, ingen verklig patient.';
  if (priority === '1' || priority === '2') {
    return [
      `${lead} Omhändertagen direkt på akutrummet efter triage. Läkarbedömd, provtagning, EKG och odlingar tagna. Behandling startad enligt ordination med god effekt; vitalparametrarna stabiliserades under vistelsen.`,
      'Överflyttad till vårdavdelning för fortsatt behandling och övervakning. Anhöriga informerade.',
    ].join('\n\n');
  }
  return [
    `${lead} Läkarbedömd efter triage. Status och provtagning utan akuta fynd. Opåverkad och vitalparametrarna oförändrade vid utskrivning.`,
    'Utskriven till hemmet med muntlig och skriftlig information. Uppföljning på vårdcentral inom en vecka, återkomst vid försämring.',
  ].join('\n\n');
}
