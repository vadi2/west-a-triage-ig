// Runs the WEST-A triage guideline on a FHIR server with clinical reasoning (HAPI FHIR,
// R4), and builds the NEWS2 and triage Observations the nurse records.
// Plain ES module for the browser and Node 20: fetch only, no dependencies.
//
//   import { fhir, runTriage, news2Observation, triageObservation } from './cds.js';
//   const client = fhir('http://localhost:8080/fhir');
//   const result = await runTriage(client, { patientId, encounterId, complaintPriority: '4' });
//   // result.proposedPriority.code === '2', result.news2.total === 5
//   const news2 = await client.create(news2Observation({ news2: result.news2, patientId, encounterId, performerId }));
//   const triage = await client.create(triageObservation({ priority: result.proposedPriority,
//     chiefComplaint: '4', news2: news2, patientId, encounterId, performerId }));

export const IG = 'https://vadi2.github.io/west-a-triage-ig';
export const PRIORITY_SYSTEM = `${IG}/CodeSystem/west-a-triage-priority-cs`;
export const CHIEF_COMPLAINT_SYSTEM = `${IG}/CodeSystem/west-a-chief-complaint-cs`;
// The triage criteria (warning symptoms) and the guide's own observation codes
export const CRITERION_SYSTEM = `${IG}/CodeSystem/west-a-triage-criterion-cs`;
export const OBSERVATION_CODE_SYSTEM = `${IG}/CodeSystem/west-a-observation-code-cs`;
export const NEWS2_PROFILE = `${IG}/StructureDefinition/west-a-news2-observation`;
export const TRIAGE_PROFILE = `${IG}/StructureDefinition/west-a-triage-observation`;
const SCT = 'http://snomed.info/sct';
const SCT_SE = 'http://snomed.info/sct/45991000052106';

// The displays of the WEST-A triage priority code system (Swedish, its language)
export const PRIORITY_DISPLAY = { 1: 'Röd', 2: 'Orange', 3: 'Gul', 4: 'Grön' };

// The NEWS2 parameter scores: CQL definition of WestANEWS2, and the SNOMED CT code and
// Swedish display of the component of the WEST-A NEWS2 Observation
const NEWS2_TEXT = 'poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2)';
const NEWS2_SCORES = [
  ['Respiration Rate Score', '1104301000000104', 'andningsfrekvens'],
  ['Oxygen Saturation Scale 1 Score', '1104311000000102', 'syremättnad 1'],
  ['Oxygen Saturation Scale 2 Score', '1104321000000108', 'syremättnad 2'],
  ['Supplemental Oxygen Score', '1104331000000105', 'tillförd syrgas'],
  ['Systolic Blood Pressure Score', '1104341000000101', 'systoliskt blodtryck'],
  ['Pulse Score', '1104351000000103', 'pulsfrekvens'],
  ['Consciousness Score', '1104361000000100', 'medvetandegrad'],
  ['Temperature Score', '1104371000000107', 'temperatur'],
];

// The vital sign observations that WestANEWS2 scores, in the order of the NEWS2 chart
const NEWS2_OBSERVATIONS = [
  'Respiration Rate Observation',
  'Oxygen Saturation Observation',
  'Supplemental Oxygen Observation',
  'Blood Pressure Observation',
  'Heart Rate Observation',
  'Consciousness Observation',
  'Body Temperature Observation',
];

const sctSe = (code, display) => ({ system: SCT, version: SCT_SE, code, display });
const survey = [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey', display: 'Survey' }] }];

/**
 * A small FHIR REST client.
 * @param {string} base  the FHIR base, e.g. http://localhost:8080/fhir
 * @param {{ headers?: object, fetch?: Function }} [options]
 */
export function fhir(base, { headers = {}, fetch: doFetch = globalThis.fetch } = {}) {
  base = base.replace(/\/+$/, '');

  async function request(method, path, body, extraHeaders = {}) {
    const url = /^https?:/.test(path) ? path : `${base}/${path.replace(/^\/+/, '')}`;
    const res = await doFetch(url, {
      method,
      headers: {
        Accept: 'application/fhir+json',
        ...(body ? { 'Content-Type': 'application/fhir+json' } : {}),
        ...extraHeaders,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    if (text) {
      try { json = JSON.parse(text); } catch { json = null; }
    }
    if (!res.ok) {
      const diagnostics = json?.resourceType === 'OperationOutcome'
        ? json.issue?.map((i) => i.diagnostics || i.details?.text).filter(Boolean).join('; ')
        : text.slice(0, 500);
      const error = new Error(`${method} ${url}: ${res.status} ${res.statusText}${diagnostics ? `: ${diagnostics}` : ''}`);
      error.status = res.status;
      error.outcome = json;
      throw error;
    }
    return json;
  }

  const query = (params = {}) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      for (const v of [].concat(value)) if (v !== undefined && v !== null) search.append(key, String(v));
    }
    const s = search.toString();
    return s ? `?${s}` : '';
  };

  // HAPI reuses the results of an identical search for 60 seconds by default
  // (reuse_cached_search_results_millis), also for the searches that the CQL engine makes
  // behind $apply and $evaluate: without this header, observations recorded within that
  // minute are not seen. HAPI passes the header on to those searches.
  const fresh = { 'Cache-Control': 'no-cache' };

  return {
    base,
    request,
    read: (type, id) => request('GET', `${type}/${encodeURIComponent(id)}`),
    /** A searchset Bundle */
    search: (type, params) => request('GET', `${type}${query(params)}`, undefined, fresh),
    create: (resource) => request('POST', resource.resourceType, resource),
    /** PUT by id */
    update: (resource) => request('PUT', `${resource.resourceType}/${encodeURIComponent(resource.id)}`, resource),
    transaction: (bundle) => request('POST', '', bundle),
    /**
     * Invoke an operation: operation('PlanDefinition/west-a-triage/$apply', parameters).
     * A Parameters resource is POSTed; with { method: 'GET' } a plain object becomes the query.
     */
    operation: (path, parameters, { method = 'POST' } = {}) => (method === 'GET'
      ? request('GET', `${path}${query(parameters)}`, undefined, fresh)
      : request('POST', path, parameters ?? { resourceType: 'Parameters' }, fresh)),
  };
}

/** A Coding of the WEST-A triage priority code system, from a code ('1'-'4') or a Coding */
export function priorityCoding(priority) {
  if (priority === null || priority === undefined || priority === '') return null;
  const code = String(typeof priority === 'object' ? priority.code : priority);
  if (typeof priority === 'object' && priority.system && priority.system !== PRIORITY_SYSTEM) {
    throw new Error(`Not a WEST-A triage priority: ${priority.system}|${code}`);
  }
  if (!PRIORITY_DISPLAY[code]) throw new Error(`Not a WEST-A triage priority code: ${code}`);
  return { system: PRIORITY_SYSTEM, code, display: PRIORITY_DISPLAY[code] };
}

/** A Coding of the WEST-A triage criterion code system, from a code or a Coding */
export function criterionCoding(criterion) {
  if (criterion === null || criterion === undefined || criterion === '') return null;
  if (typeof criterion === 'object') return { system: CRITERION_SYSTEM, ...criterion };
  return { system: CRITERION_SYSTEM, code: String(criterion) };
}

/** A Coding of the WEST-A chief complaint code system, from a code or a Coding */
export function chiefComplaintCoding(complaint) {
  if (complaint === null || complaint === undefined || complaint === '') return null;
  if (typeof complaint === 'object') return { system: CHIEF_COMPLAINT_SYSTEM, ...complaint };
  return { system: CHIEF_COMPLAINT_SYSTEM, code: String(complaint) };
}

const reference = (type, id) => (id === undefined || id === null ? undefined
  : { reference: String(id).includes('/') ? String(id) : `${type}/${id}` });

// The value of an output parameter of $evaluate: null for a null result, which HAPI
// returns as a data-absent-reason extension on _valueBoolean
function parameterValue(parameter) {
  if (!parameter) return null;
  if (parameter.resource) return parameter.resource;
  const key = Object.keys(parameter).find((k) => k.startsWith('value'));
  return key ? parameter[key] : null;
}

function outputs(parameters) {
  const values = {};
  for (const p of parameters?.parameter ?? []) values[p.name] = parameterValue(p);
  return values;
}

// The CQL parameters of the WEST-A libraries, as a Parameters resource
function cqlParameters({ complaintPriority, yellowAsLowest, scale2, triageCriteria }) {
  const parameter = [
    { name: 'Yellow As Lowest Priority', valueBoolean: !!yellowAsLowest },
    { name: 'Use Oxygen Saturation Scale 2', valueBoolean: !!scale2 },
  ];
  const complaint = priorityCoding(complaintPriority);
  // Not yet assessed: leave the parameter out, so it is null and no priority is proposed
  if (complaint) parameter.unshift({ name: 'Complaint Priority', valueCoding: complaint });
  // A list parameter of CQL: one entry per element, and none at all when not given.
  // HAPI (clinical-reasoning, HAPI 8.12) passes a parameter given once to the CQL as a single
  // Code, not a list of one, and "Triage Criteria" then evaluates to null; a single criterion is
  // therefore sent twice, which the logic reads as the same list (the most urgent, exists).
  const criteria = (triageCriteria ?? []).map(criterionCoding).filter(Boolean);
  for (const criterion of criteria.length === 1 ? [criteria[0], criteria[0]] : criteria) {
    parameter.push({ name: 'Triage Criteria', valueCoding: criterion });
  }
  return { resourceType: 'Parameters', parameter };
}

// The RequestGroup of the CarePlan that $apply returns, walked in the order of its
// actions, with the contained resources that the actions reference
function walkCarePlan(carePlan, plan = 'PlanDefinition/west-a-triage') {
  const contained = new Map((carePlan.contained ?? []).map((r) => [`#${r.id}`, r]));
  const root = carePlan.resourceType === 'RequestGroup' ? carePlan
    : (carePlan.contained ?? []).find((r) => r.resourceType === 'RequestGroup'
      && (r.instantiatesCanonical ?? []).some((c) => c.split('|')[0].endsWith(plan)))
      ?? contained.get(carePlan.activity?.[0]?.reference?.reference);
  const summaries = [];
  const proposed = [];
  const seen = new Set();
  const visit = (actions, parentId) => {
    for (const action of actions ?? []) {
      const coding = action.code?.flatMap((c) => c.coding ?? []).find((c) => c.system === PRIORITY_SYSTEM);
      if (coding && parentId === 'propose-priority') proposed.push(coding);
      const target = contained.get(action.resource?.reference);
      if (target && !seen.has(target.id)) {
        seen.add(target.id);
        if (target.resourceType === 'RequestGroup') visit(target.action, target.id);
        else if (target.description) summaries.push(target.description);
      }
      visit(action.action, action.id ?? parentId);
    }
  };
  if (root) visit(root.action);
  return { requestGroup: root ?? null, summaries, proposed };
}

/**
 * Run the WEST-A triage guideline for a patient and an encounter.
 *
 * - PlanDefinition/west-a-triage/$apply gives the CarePlan, the proposed priority (the
 *   action the CQL selects) and the descriptions of the proposed tasks;
 * - Library/WestANEWS2/$evaluate gives the parameter scores, the total, the clinical risk
 *   and the vital sign observations they are calculated from;
 * - Library/WestATriage/$evaluate gives the priority from the vital parameters, and the
 *   proposed priority, which must agree with $apply.
 *
 * @param {ReturnType<typeof fhir>} client
 * @param {object} options
 * @param {string} options.patientId   'example-patient-personnummer' or 'Patient/...'
 * @param {string} [options.encounterId]
 * @param {string} [options.practitionerId]
 * @param {string|object|null} [options.complaintPriority]  the priority of the warning
 *   symptoms of the chief complaint, a code '1'-'4' or a Coding; null when not assessed
 * @param {boolean} [options.yellowAsLowest]  frail elderly, likely admission, violence
 * @param {boolean} [options.scale2]  NEWS2 SpO2 scale 2
 * @param {Array<string|object>} [options.triageCriteria]  the triage criteria (warning
 *   symptoms) the nurse found, codes or Codings of the WEST-A triage criterion code system;
 *   passed as the CQL parameter `Triage Criteria` only when given
 * @returns {Promise<{
 *   news2: { total: number|null, risk: string|null, scale2: boolean,
 *            scores: Object<string, number|null>, derivedFrom: {reference: string}[] },
 *   proposedPriority: object|null, vitalParameterPriority: object|null,
 *   summaries: string[], carePlan: object }>}
 */
export async function runTriage(client, {
  patientId, encounterId, practitionerId, complaintPriority = null, yellowAsLowest = false, scale2 = false,
  triageCriteria,
} = {}) {
  if (!patientId) throw new Error('runTriage needs a patientId');
  const subject = reference('Patient', patientId).reference;
  const parameters = cqlParameters({ complaintPriority, yellowAsLowest, scale2, triageCriteria });

  const applyParameters = {
    resourceType: 'Parameters',
    parameter: [
      { name: 'subject', valueString: subject },
      ...(encounterId ? [{ name: 'encounter', valueString: reference('Encounter', encounterId).reference }] : []),
      ...(practitionerId ? [{ name: 'practitioner', valueString: reference('Practitioner', practitionerId).reference }] : []),
      { name: 'parameters', resource: parameters },
    ],
  };
  const evaluate = (library, expressions) => client.operation(`Library/${library}/$evaluate`, {
    resourceType: 'Parameters',
    parameter: [
      { name: 'subject', valueString: subject },
      ...expressions.map((e) => ({ name: 'expression', valueString: e })),
      { name: 'parameters', resource: parameters },
    ],
  });

  const scoreNames = NEWS2_SCORES.map(([name]) => name);
  const [carePlan, news2Out, triageOut] = await Promise.all([
    client.operation('PlanDefinition/west-a-triage/$apply', applyParameters),
    evaluate('WestANEWS2', ['NEWS2 Total Score', 'NEWS2 Clinical Risk', ...scoreNames, ...NEWS2_OBSERVATIONS]),
    evaluate('WestATriage', ['Vital Parameter Priority', 'Proposed Priority']),
  ]);

  const n = outputs(news2Out);
  const t = outputs(triageOut);
  // The seven scores of the selected scale, by CQL definition name
  const unused = scale2 ? 'Oxygen Saturation Scale 1 Score' : 'Oxygen Saturation Scale 2 Score';
  const scores = Object.fromEntries(scoreNames.filter((s) => s !== unused).map((s) => [s, n[s] ?? null]));
  const derivedFrom = NEWS2_OBSERVATIONS
    .map((e) => n[e])
    .filter((o) => o?.resourceType === 'Observation' && o.id)
    .map((o) => ({ reference: `Observation/${o.id}` }));

  const { summaries, proposed } = walkCarePlan(carePlan);
  if (proposed.length > 1) throw new Error(`$apply proposed ${proposed.length} priorities, expected at most one`);
  const proposedPriority = proposed.length ? priorityCoding(proposed[0]) : null;
  const evaluated = t['Proposed Priority'] ? priorityCoding(t['Proposed Priority']) : null;
  if ((proposedPriority?.code ?? null) !== (evaluated?.code ?? null)) {
    throw new Error(`$apply proposed ${proposedPriority?.code ?? 'nothing'}, but WestATriage evaluates to ${evaluated?.code ?? 'nothing'}`);
  }

  return {
    news2: {
      total: n['NEWS2 Total Score'] ?? null,
      risk: n['NEWS2 Clinical Risk'] ?? null,
      scale2: !!scale2,
      scores,
      derivedFrom,
    },
    proposedPriority,
    vitalParameterPriority: t['Vital Parameter Priority'] ? priorityCoding(t['Vital Parameter Priority']) : null,
    summaries,
    carePlan,
  };
}

/**
 * A WEST-A NEWS2 Observation from the NEWS2 result of runTriage.
 * @param {object} options
 * @param {{ total: number, scores: object, scale2?: boolean, derivedFrom?: object[] }} options.news2
 * @param {string} options.patientId
 * @param {string} [options.encounterId]
 * @param {string} [options.performerId]  Practitioner id (or 'PractitionerRole/...')
 * @param {string} [options.effectiveDateTime]  default now
 * @param {Array<string|object>} [options.derivedFrom]  default news2.derivedFrom: the
 *   vital sign observations the scores come from
 * @param {string} [options.id]
 */
export function news2Observation({
  news2, patientId, encounterId, performerId, effectiveDateTime = new Date().toISOString(), derivedFrom, id,
}) {
  if (!news2 || news2.total === null || news2.total === undefined) throw new Error('NEWS2 is not calculated: not all seven parameters are measured');
  if (!patientId) throw new Error('news2Observation needs a patientId');
  const component = NEWS2_SCORES
    .filter(([name]) => news2.scores[name] !== null && news2.scores[name] !== undefined)
    .map(([name, code, display]) => ({
      code: { coding: [sctSe(code, `${NEWS2_TEXT}, ${display}`)] },
      valueInteger: news2.scores[name],
    }));
  const sum = component.reduce((total, c) => total + c.valueInteger, 0);
  if (component.length === 7 && sum !== news2.total) throw new Error(`NEWS2 total ${news2.total} is not the sum of the scores, ${sum}`);
  const sources = (derivedFrom ?? news2.derivedFrom ?? []).map((r) => (typeof r === 'string' ? reference('Observation', r) : r));
  return {
    resourceType: 'Observation',
    ...(id ? { id } : {}),
    meta: { profile: [NEWS2_PROFILE] },
    language: 'sv',
    status: 'final',
    category: survey,
    code: { coding: [sctSe('1104051000000101', `${NEWS2_TEXT}, totalpoäng`)] },
    subject: reference('Patient', patientId),
    ...(encounterId ? { encounter: reference('Encounter', encounterId) } : {}),
    effectiveDateTime,
    ...(performerId ? { performer: [reference('Practitioner', performerId)] } : {}),
    valueInteger: news2.total,
    ...(sources.length ? { derivedFrom: sources } : {}),
    component,
  };
}

/**
 * A WEST-A Triage Observation with the priority the nurse confirmed.
 * @param {object} options
 * @param {string|object} options.priority  the confirmed priority, code '1'-'4' or Coding
 * @param {string|object} options.chiefComplaint  WEST-A chief complaint, code or Coding
 * @param {object|string} [options.news2]  the recorded NEWS2 Observation (resource, or its
 *   id or reference), which goes in derivedFrom
 * @param {object|string} [options.proposedPriority]  when given, a priority less urgent
 *   than a proposed red or orange is refused (WEST-A p. 8)
 * @param {string} options.patientId
 * @param {string} [options.encounterId]
 * @param {string} [options.performerId]  the triage nurse
 * @param {string} [options.effectiveDateTime]  default now
 * @param {string} [options.note]
 * @param {Array<string|object>} [options.derivedFrom]  more observations the priority is based on
 * @param {Array<string|object>} [options.criteria]  the triage criteria found, codes or
 *   Codings of the WEST-A triage criterion code system: one component each
 * @param {string} [options.id]
 */
export function triageObservation({
  priority, chiefComplaint, news2, proposedPriority, patientId, encounterId, performerId,
  effectiveDateTime = new Date().toISOString(), note, derivedFrom = [], criteria = [], id,
}) {
  const value = priorityCoding(priority);
  if (!value) throw new Error('triageObservation needs the confirmed priority');
  const complaint = chiefComplaintCoding(chiefComplaint);
  if (!complaint) throw new Error('triageObservation needs the chief complaint');
  if (!patientId) throw new Error('triageObservation needs a patientId');
  const proposed = priorityCoding(proposedPriority);
  if (proposed && Number(proposed.code) <= 2 && Number(value.code) > Number(proposed.code)) {
    throw new Error(`${proposed.display} is proposed, and a red or orange patient is never given a lower priority (WEST-A p. 8)`);
  }
  const news2Reference = !news2 ? null
    : typeof news2 === 'string' ? reference('Observation', news2)
      : news2.resourceType ? reference('Observation', news2.id) : news2;
  const sources = [news2Reference, ...derivedFrom.map((r) => (typeof r === 'string' ? reference('Observation', r) : r))]
    .filter((r) => r?.reference);
  return {
    resourceType: 'Observation',
    ...(id ? { id } : {}),
    meta: { profile: [TRIAGE_PROFILE] },
    language: 'sv',
    status: 'final',
    category: survey,
    code: { coding: [sctSe('425705009', 'triagering')] },
    subject: reference('Patient', patientId),
    ...(encounterId ? { encounter: reference('Encounter', encounterId) } : {}),
    effectiveDateTime,
    ...(performerId ? { performer: [reference('Practitioner', performerId)] } : {}),
    valueCodeableConcept: { coding: [value] },
    ...(note ? { note: [{ text: note }] } : {}),
    ...(sources.length ? { derivedFrom: sources } : {}),
    component: [
      {
        code: { coding: [sctSe('1269489004', 'sökorsak')] },
        valueCodeableConcept: { coding: [complaint] },
      },
      ...criteria.map(criterionCoding).filter(Boolean).map((criterion) => ({
        code: { coding: [{ system: OBSERVATION_CODE_SYSTEM, code: '1' }] },
        valueCodeableConcept: { coding: [criterion] },
      })),
    ],
  };
}
