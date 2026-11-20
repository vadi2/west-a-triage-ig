// VITE_MOCK=1 runs the app against an in-memory FHIR server seeded with the guide's examples;
// the guideline ($apply/$evaluate) is then applied in the browser. demo/lib builds the resources
// in both modes. Anything else talks to HAPI.
export const MOCK = import.meta.env.VITE_MOCK === '1';

export const FHIR_BASE: string = import.meta.env.VITE_FHIR_BASE || '/fhir';

export const IG = 'https://vadi2.github.io/west-a-triage-ig';

export const QUESTIONNAIRE_ID = 'west-a-triage-questionnaire';
export const QUESTIONNAIRE_URL = `${IG}/Questionnaire/${QUESTIONNAIRE_ID}`;

// The nurse who uses the app. The HAPI load script brings in this example Practitioner.
export const NURSE = { id: 'example-practitioner-triage-nurse', name: 'Anna Berg' };

export const profile = (id: string) => `${IG}/StructureDefinition/${id}`;

/** An absolute URL for the FHIR base, for libraries that cannot take a relative one. */
export function absoluteBase(): string {
  return new URL(FHIR_BASE, window.location.origin).toString().replace(/\/$/, '');
}
