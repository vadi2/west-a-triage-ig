import type { Bundle, Questionnaire, QuestionnaireResponse } from 'fhir/r4';
import { lib } from './libs';

/**
 * The vital sign Observations of a filled triage form, as a transaction Bundle: SDC
 * template-based extraction by demo/lib/extract.js, in both modes (it runs in the browser).
 */
export function extractVitals(questionnaire: Questionnaire, qr: QuestionnaireResponse): Promise<Bundle> {
  return lib('extract').extractVitals(questionnaire, qr);
}
