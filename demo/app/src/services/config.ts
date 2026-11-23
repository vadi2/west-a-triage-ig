// The guide and the app's fixed parts. Where the data lives (the public HAPI sandbox, this
// browser, or another FHIR server) is chosen at runtime: see services/backend.ts.

export const IG = 'https://vadi2.github.io/west-a-triage-ig';

export const QUESTIONNAIRE_ID = 'west-a-triage-questionnaire';
export const QUESTIONNAIRE_URL = `${IG}/Questionnaire/${QUESTIONNAIRE_ID}`;

// The nurse who uses the app, the guide's example Practitioner. The HAPI load script brings it
// in; on another server the app creates it (services/backend.ts, prepareServer).
export const NURSE = { id: 'example-practitioner-triage-nurse', name: 'Anna Berg', given: 'Anna', family: 'Berg' };

export const profile = (id: string) => `${IG}/StructureDefinition/${id}`;
