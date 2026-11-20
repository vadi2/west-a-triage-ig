import type { Bundle, Coding, Observation, Questionnaire, QuestionnaireResponse, Reference } from 'fhir/r4';
import { MOCK, profile } from './config';
import { readAnswers } from './answers';
import { loadLib, uuid } from './libs';
import { ACVPU } from './news2';

/** demo/lib/extract.js, as the contract in demo/README.md has it. */
export interface ExtractModule {
  extractVitals(questionnaire: Questionnaire, questionnaireResponse: QuestionnaireResponse): Promise<Bundle>;
}

/**
 * The vital sign Observations of a filled triage form, as a transaction Bundle (SDC template
 * extraction). Mock mode builds the same seven Observations locally.
 */
export async function extractVitals(questionnaire: Questionnaire, qr: QuestionnaireResponse): Promise<Bundle> {
  if (MOCK) return mockExtract(qr);
  const lib = await loadLib<ExtractModule>('extract');
  return lib.extractVitals(questionnaire, qr);
}

const LOINC = 'http://loinc.org';
const SCT = 'http://snomed.info/sct';
const UCUM = 'http://unitsofmeasure.org';
const CAT = 'http://terminology.hl7.org/CodeSystem/observation-category';

const cat = (code: string, display: string) => [{ coding: [{ system: CAT, code, display }] }];
const qty = (value: number, code: string, unit = code) => ({ value, unit, system: UCUM, code });

function mockExtract(qr: QuestionnaireResponse): Bundle {
  const a = readAnswers(qr);
  const context = {
    status: 'final' as const,
    subject: qr.subject,
    encounter: qr.encounter,
    performer: qr.author ? [qr.author] : undefined,
    effectiveDateTime: qr.authored,
    derivedFrom: qr.id ? [{ reference: `QuestionnaireResponse/${qr.id}` } as Reference] : undefined,
  };
  const vital = (id: string, code: Coding[], value: Partial<Observation>, category = cat('vital-signs', 'Vital Signs')): Observation => ({
    resourceType: 'Observation',
    meta: { profile: [profile(id)] },
    category,
    code: { coding: code },
    ...context,
    ...value,
  });

  const obs: Observation[] = [];
  if (a.respiratoryRate !== undefined)
    obs.push(vital('west-a-respiratory-rate', [{ system: LOINC, code: '9279-1', display: 'Respiratory rate' }], { valueQuantity: qty(a.respiratoryRate, '/min') }));
  if (a.oxygenSaturation !== undefined)
    obs.push(vital('west-a-oxygen-saturation', [{ system: LOINC, code: '2708-6', display: 'Oxygen saturation in Arterial blood' }], { valueQuantity: qty(a.oxygenSaturation, '%') }));
  if (a.oxygenFlow !== undefined)
    obs.push(vital('west-a-supplemental-oxygen', [{ system: SCT, code: '427081008', display: 'Delivered oxygen flow rate' }], { valueQuantity: qty(a.oxygenFlow, 'L/min') }, cat('therapy', 'Therapy')));
  if (a.systolic !== undefined || a.diastolic !== undefined)
    obs.push(
      vital('west-a-blood-pressure', [{ system: LOINC, code: '85354-9', display: 'Blood pressure panel with all children optional' }], {
        component: [
          ...(a.systolic !== undefined
            ? [{ code: { coding: [{ system: LOINC, code: '8480-6', display: 'Systolic blood pressure' }] }, valueQuantity: qty(a.systolic, 'mm[Hg]', 'mmHg') }]
            : []),
          ...(a.diastolic !== undefined
            ? [{ code: { coding: [{ system: LOINC, code: '8462-4', display: 'Diastolic blood pressure' }] }, valueQuantity: qty(a.diastolic, 'mm[Hg]', 'mmHg') }]
            : []),
        ],
      }),
    );
  if (a.heartRate !== undefined)
    obs.push(vital('west-a-heart-rate', [{ system: LOINC, code: '8867-4', display: 'Heart rate' }], { valueQuantity: qty(a.heartRate, '/min') }));
  if (a.consciousness)
    obs.push(
      vital(
        'west-a-consciousness',
        [{ system: SCT, code: '1104441000000107', display: 'ACVPU (Alert Confusion Voice Pain Unresponsive) scale score' }],
        { valueCodeableConcept: { coding: [{ system: SCT, code: a.consciousness.code, display: ACVPU.find((x) => x.code === a.consciousness?.code)?.display }] } },
        cat('exam', 'Exam'),
      ),
    );
  if (a.temperature !== undefined)
    obs.push(vital('west-a-body-temperature', [{ system: LOINC, code: '8310-5', display: 'Body temperature' }], { valueQuantity: qty(a.temperature, 'Cel', '°C') }));

  return {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: obs.map((resource) => ({ fullUrl: uuid(), resource, request: { method: 'POST', url: 'Observation' } })),
  };
}
