// Wraps a WEST-A emergency department triage, and the stay that follows it, into an
// HL7 Europe Hospital Discharge Report (hl7.fhir.eu.hdr 1.0.0, FHIR R4): a document
// Bundle conforming to http://hl7.eu/fhir/hdr/StructureDefinition/bundle-eu-hdr.
//
// Plain ES module without dependencies, for the browser and Node 20.

export const HDR_PROFILES = {
  bundle: 'http://hl7.eu/fhir/hdr/StructureDefinition/bundle-eu-hdr',
  composition: 'http://hl7.eu/fhir/hdr/StructureDefinition/composition-eu-hdr',
  encounter: 'http://hl7.eu/fhir/hdr/StructureDefinition/encounter-eu-hdr',
  patient: 'http://hl7.eu/fhir/base/StructureDefinition/patient-eu-core',
  practitioner: 'http://hl7.eu/fhir/base/StructureDefinition/practitioner-eu-core',
  practitionerRole: 'http://hl7.eu/fhir/base/StructureDefinition/practitionerRole-eu-core',
  organization: 'http://hl7.eu/fhir/base/StructureDefinition/organization-eu-core',
};

const LOINC = 'http://loinc.org';
const SCT = 'http://snomed.info/sct';
const SCT_SE = 'http://snomed.info/sct/45991000052106';
const XHTML = 'http://www.w3.org/1999/xhtml';
const DATA_ABSENT = 'http://hl7.org/fhir/StructureDefinition/data-absent-reason';

// HDR section codes (LOINC), with titles per narrative language
const SECTIONS = {
  admissionEvaluation: { code: '67851-6', display: 'Admission evaluation note', sv: 'Bedömning vid ankomst', en: 'Admission evaluation' },
  vitalSigns: { code: '8716-3', display: 'Vital signs note', sv: 'Vitalparametrar vid triage', en: 'Vital signs at triage' },
  hospitalCourse: { code: '8648-8', display: 'Hospital course note', sv: 'Vårdförlopp', en: 'Hospital course' },
  dischargeDetails: { code: '8650-4', display: 'Hospital discharge disposition note', sv: 'Utskrivning', en: 'Discharge details' },
  dischargeMedications: { code: '75311-1', display: 'Discharge medications note', sv: 'Läkemedel vid utskrivning', en: 'Discharge medications' },
};

const LABELS = {
  sv: {
    title: 'Epikris',
    patient: 'Patient',
    identifier: 'Identitet',
    birthDate: 'Födelsedatum',
    gender: 'Kön',
    genders: { female: 'kvinna', male: 'man', other: 'annat', unknown: 'okänt' },
    encounter: 'Vårdkontakt',
    period: 'Period',
    unit: 'Vårdenhet',
    author: 'Författare',
    triage: 'Triage (WEST-A)',
    priority: 'Prioritet',
    complaint: 'Sökorsak',
    note: 'Anteckning',
    news2: 'NEWS2',
    news2Total: 'NEWS2 totalpoäng',
    risk: 'klinisk risk',
    risks: { low: 'låg', lowMedium: 'låg till medelhög', medium: 'medelhög', high: 'hög' },
    parameter: 'Parameter',
    score: 'Poäng',
    value: 'Värde',
    time: 'Tid',
    performer: 'Utförd av',
    roomAir: 'luft',
    arrived: 'Ankomst till akutmottagningen',
    triaged: 'Triagerad',
    by: 'av',
    discharged: 'Utskriven',
    noSummary: 'Ingen sammanfattning av vårdförloppet har dokumenterats.',
    noMedications: 'Uppgifter om läkemedel vid utskrivning finns inte i triagejournalen.',
    status: 'Status',
    statuses: { finished: 'avslutad', 'in-progress': 'pågående', triaged: 'triagerad' },
    class: 'Typ',
    classes: { EMER: 'akutbesök', IMP: 'inneliggande', AMB: 'öppenvård' },
    reason: 'Kontaktorsak',
    nurse: 'Triagesjuksköterska',
    nurseCode: 'legitimerad sjuksköterska',
    organization: 'Organisation',
    practitioner: 'Hälso- och sjukvårdspersonal',
    role: 'Roll',
    unknown: 'okänt',
  },
  en: {
    title: 'Hospital Discharge Report',
    patient: 'Patient',
    identifier: 'Identifier',
    birthDate: 'Date of birth',
    gender: 'Gender',
    genders: { female: 'female', male: 'male', other: 'other', unknown: 'unknown' },
    encounter: 'Encounter',
    period: 'Period',
    unit: 'Care unit',
    author: 'Author',
    triage: 'Triage (WEST-A)',
    priority: 'Priority',
    complaint: 'Chief complaint',
    note: 'Note',
    news2: 'NEWS2',
    news2Total: 'NEWS2 total score',
    risk: 'clinical risk',
    risks: { low: 'low', lowMedium: 'low-medium', medium: 'medium', high: 'high' },
    parameter: 'Parameter',
    score: 'Score',
    value: 'Value',
    time: 'Time',
    performer: 'Performed by',
    roomAir: 'room air',
    arrived: 'Arrived at the emergency department',
    triaged: 'Triaged',
    by: 'by',
    discharged: 'Discharged',
    noSummary: 'No summary of the hospital course has been recorded.',
    noMedications: 'The triage record holds no information about medication at discharge.',
    status: 'Status',
    statuses: { finished: 'finished', 'in-progress': 'in progress', triaged: 'triaged' },
    class: 'Class',
    classes: {},
    reason: 'Reason for encounter',
    nurse: 'Triage nurse',
    nurseCode: 'Registered nurse',
    organization: 'Organization',
    practitioner: 'Practitioner',
    role: 'Role',
    unknown: 'unknown',
  },
};

// English names of the WEST-A codes, for an English narrative (the codings carry Swedish displays)
const EN_NAMES = {
  '86290005': 'Respiratory rate',
  '431314004': 'Peripheral oxygen saturation',
  '427081008': 'Supplemental oxygen flow',
  '75367002': 'Blood pressure',
  '364075005': 'Heart rate',
  '1104441000000107': 'Level of consciousness (ACVPU)',
  '386725007': 'Body temperature',
  '1104301000000104': 'Respiration rate',
  '1104311000000102': 'Oxygen saturation (scale 1)',
  '1104321000000108': 'Oxygen saturation (scale 2)',
  '1104331000000105': 'Air or oxygen',
  '1104341000000101': 'Systolic blood pressure',
  '1104351000000103': 'Pulse',
  '1104361000000100': 'Consciousness',
  '1104371000000107': 'Temperature',
};
// Shorter Swedish names where the Swedish SNOMED CT display is long
const SV_NAMES = {
  '1104441000000107': 'Medvetandegrad (ACVPU)',
};
const PRIORITY = {
  '1': { en: 'Red', colour: '#c62828', text: '#fff' },
  '2': { en: 'Orange', colour: '#ef6c00', text: '#fff' },
  '3': { en: 'Yellow', colour: '#fdd835', text: '#000' },
  '4': { en: 'Green', colour: '#2e7d32', text: '#fff' },
};
const CHIEF_COMPLAINT = '1269489004';

/**
 * Builds an HL7 Europe Hospital Discharge Report document Bundle.
 *
 * @param {object} input
 * @param {object} input.patient WEST-A Patient
 * @param {object} input.encounter the emergency department Encounter
 * @param {object} input.author Practitioner who authored the report (the triage nurse)
 * @param {object} [input.organization] custodian Organization; a synthetic placeholder emergency department when absent
 * @param {object[]} input.vitals the WEST-A vital sign Observations
 * @param {object} input.news2 WEST-A NEWS2 Observation
 * @param {object} input.triage WEST-A Triage Observation
 * @param {string} [input.dischargeDate] FHIR dateTime of discharge; defaults to the end of the encounter, else `date`
 * @param {string} [input.dischargeSummary] plain text of the hospital course; blank lines separate paragraphs
 * @param {string} [input.language] BCP 47 language of the document; defaults to the language of the resources, else "sv"
 * @param {string} [input.date] FHIR dateTime of the document; defaults to now
 * @param {string} [input.documentId] UUID of the document; defaults to a random one
 * @param {string} [input.fhirBase] base URL of the FHIR server the resources come from, to make references
 *   to resources outside the document absolute
 * @returns {object} document Bundle
 */
export function dischargeReport(input) {
  const { patient, encounter, author, vitals, news2, triage } = input ?? {};
  for (const [name, res, type] of [
    ['patient', patient, 'Patient'], ['encounter', encounter, 'Encounter'], ['author', author, 'Practitioner'],
    ['news2', news2, 'Observation'], ['triage', triage, 'Observation'],
  ]) {
    if (res?.resourceType !== type) throw new TypeError(`dischargeReport: ${name} must be a ${type}`);
  }
  if (!Array.isArray(vitals) || vitals.some((v) => v?.resourceType !== 'Observation')) {
    throw new TypeError('dischargeReport: vitals must be an array of Observations');
  }
  if (input.organization && input.organization.resourceType !== 'Organization') {
    throw new TypeError('dischargeReport: organization must be an Organization');
  }

  const inputs = [patient, encounter, author, input.organization, ...vitals, news2, triage].filter(Boolean);
  const language = documentLanguage(input.language, inputs);
  const L = LABELS[language.split('-')[0].toLowerCase()] ?? LABELS.en;
  const date = input.date ?? new Date().toISOString();
  const dischargeDate = input.dischargeDate ?? encounter.period?.end ?? date;
  const documentId = input.documentId ?? randomUuid();
  if (!isUuid(documentId)) throw new TypeError('dischargeReport: documentId must be a UUID');
  if (encounter.period?.start && compareDateTime(dischargeDate, encounter.period.start) < 0) {
    throw new RangeError('dischargeReport: dischargeDate is before the start of the encounter');
  }

  const ctx = { L, language };

  // Copies of the input resources; references are rewritten to the document's urn:uuids below
  const pat = mapPatient(clone(patient));
  const practitioner = mapPractitioner(clone(author));
  const organization = input.organization ? clone(input.organization) : placeholderOrganization(language);
  const vitalObs = vitals.map(clone);
  const news2Obs = clone(news2);
  const triageObs = clone(triage);
  for (const r of [pat, practitioner, organization, ...vitalObs, news2Obs, triageObs]) r.id ??= randomUuid();
  const role = practitionerRole(practitioner, organization, ctx);
  const enc = mapEncounter(clone(encounter), { organization, triage: triageObs, dischargeDate });
  enc.id ??= randomUuid();

  const resources = [pat, enc, role, practitioner, organization, ...vitalObs, news2Obs, triageObs];
  const fullUrls = new Map();
  for (const r of resources) {
    const key = `${r.resourceType}/${r.id}`;
    if (fullUrls.has(key)) throw new Error(`dischargeReport: ${key} is given twice`);
    fullUrls.set(key, `urn:uuid:${uuidFrom(key)}`);
  }
  const ref = (r) => ({ reference: fullUrls.get(`${r.resourceType}/${r.id}`) });
  for (const r of resources) rewriteReferences(r, fullUrls, input.fhirBase);

  // Narrative for the resources that have none, and anew for the Encounter, which changed
  const names = { practitioner: humanName(practitioner.name), organization: organization.name };
  enc.text = narrative(encounterHtml(enc, ctx, names), language);
  for (const r of resources) {
    if (!r.text?.div) r.text = narrative(resourceHtml(r, ctx, names), language);
  }

  const composition = {
    resourceType: 'Composition',
    id: uuidFrom(`Composition/${documentId}`),
    meta: { profile: [HDR_PROFILES.composition] },
    language,
    identifier: { system: 'urn:ietf:rfc:3986', value: `urn:uuid:${uuidFrom(`Composition/${documentId}`)}` },
    status: 'final',
    type: { coding: [{ system: LOINC, code: '34105-7', display: 'Hospital Discharge summary' }] },
    category: [{ coding: [{ system: LOINC, code: 'LP72467-1', display: 'Discharge summary note' }] }],
    subject: ref(pat),
    encounter: ref(enc),
    date,
    author: [ref(role)],
    title: L.title,
    custodian: ref(organization),
    event: [{ period: { ...enc.period } }],
    section: [
      admissionEvaluationSection({ triage: triageObs, news2: news2Obs, vitals: vitalObs, practitioner, ref }, ctx),
      hospitalCourseSection({ encounter: enc, triage: triageObs, practitioner, summary: input.dischargeSummary }, ctx),
      dischargeDetailsSection({ encounter: enc, organization }, ctx),
      dischargeMedicationsSection(ctx),
    ],
  };
  composition.text = narrative(compositionHtml({ patient: pat, encounter: enc, triage: triageObs, news2: news2Obs, practitioner, organization }, ctx), language);

  return {
    resourceType: 'Bundle',
    id: documentId,
    meta: { profile: [HDR_PROFILES.bundle] },
    language,
    identifier: { system: 'urn:ietf:rfc:3986', value: `urn:uuid:${documentId}` },
    type: 'document',
    timestamp: date,
    entry: [
      { fullUrl: `urn:uuid:${composition.id}`, resource: composition },
      ...resources.map((r) => ({ fullUrl: fullUrls.get(`${r.resourceType}/${r.id}`), resource: r })),
    ],
  };
}

// ---------------------------------------------------------------- resources

function mapPatient(p) {
  // patient-eu-core: name and birthDate are required; mark them absent rather than invent them
  if (!p.name?.length) p.name = [{ extension: [absent('unknown')] }];
  if (!p.birthDate && !p._birthDate) p._birthDate = { extension: [absent('unknown')] };
  return p;
}

function mapPractitioner(p) {
  // practitioner-eu-core: name is required
  if (!p.name?.length) p.name = [{ extension: [absent('unknown')] }];
  return p;
}

function placeholderOrganization(language) {
  // Synthetic: no real hospital, no real HSA-id
  return {
    resourceType: 'Organization',
    id: 'west-a-demo-emergency-department',
    meta: { profile: [HDR_PROFILES.organization] },
    language,
    active: true,
    type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/organization-type', code: 'prov', display: 'Healthcare Provider' }] }],
    name: 'Akutmottagningen, Exempelsjukhuset (syntetisk demo, Västra Götalandsregionen)',
    address: [{ use: 'work', type: 'physical', city: 'Göteborg', country: 'SE' }],
  };
}

function practitionerRole(practitioner, organization, { L, language }) {
  return {
    resourceType: 'PractitionerRole',
    id: uuidFrom(`PractitionerRole/${practitioner.id}|${organization.id}`),
    meta: { profile: [HDR_PROFILES.practitionerRole] },
    language,
    active: true,
    practitioner: { reference: `Practitioner/${practitioner.id}` },
    organization: { reference: `Organization/${organization.id}` },
    code: [{
      coding: [{ system: SCT, version: SCT_SE, code: '224535009', display: L.nurseCode }],
      text: L.nurse,
    }],
  };
}

function mapEncounter(e, { organization, triage, dischargeDate }) {
  e.meta = { ...e.meta, profile: [...new Set([...(e.meta?.profile ?? []), HDR_PROFILES.encounter])] };
  // The report is written at discharge: the encounter has ended
  e.status = 'finished';
  e.period = { ...e.period, end: dischargeDate };
  if (!e.serviceProvider) e.serviceProvider = { reference: `Organization/${organization.id}` };
  if (!e.priority && e.class?.code === 'EMER') {
    e.priority = { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ActPriority', code: 'EM', display: 'emergency' }] };
  }
  // The reason is the chief complaint, coded in the triage Observation. Only its text goes in
  // reasonCode: the WEST-A codes are not in the HDR condition value set, which is preferred.
  const complaint = chiefComplaint(triage);
  if (!e.reasonCode?.length && !e.reasonReference?.length && complaint) {
    e.reasonCode = [{ text: display(complaint) }];
    e.reasonReference = [{ reference: `Observation/${triage.id}` }];
  }
  return e;
}

// ---------------------------------------------------------------- sections

function section(key, { L }, body) {
  const s = SECTIONS[key];
  return {
    title: L === LABELS.sv ? s.sv : s.en,
    code: { coding: [{ system: LOINC, code: s.code, display: s.display }] },
    ...body,
  };
}

function admissionEvaluationSection({ triage, news2, vitals, practitioner, ref }, ctx) {
  const { L } = ctx;
  const vitalSigns = section('vitalSigns', ctx, {
    text: narrative(vitalsTable(vitals, ctx), ctx.language),
    entry: vitals.map(ref),
  });
  return section('admissionEvaluation', ctx, {
    text: narrative(
      `<p>${esc(L.triaged)} ${esc(dateTime(triage.effectiveDateTime))} ${esc(L.by)} ${esc(humanName(practitioner.name))}.</p>`
      + triageTable(triage, news2, ctx)
      + news2Table(news2, ctx),
      ctx.language,
    ),
    entry: [ref(triage), ref(news2)],
    section: [vitalSigns],
  });
}

function hospitalCourseSection({ encounter, triage, practitioner, summary }, ctx) {
  const { L } = ctx;
  const steps = [
    encounter.period?.start && `${L.arrived}: ${dateTime(encounter.period.start)}`,
    triage.effectiveDateTime && `${L.triaged}: ${dateTime(triage.effectiveDateTime)}, ${L.priority.toLowerCase()} ${priorityName(triage, ctx)}, ${L.complaint.toLowerCase()} ${display(chiefComplaint(triage))}`,
    encounter.period?.end && `${L.discharged}: ${dateTime(encounter.period.end)}`,
  ].filter(Boolean);
  const text = summary?.trim()
    ? summary.trim().split(/\n\s*\n/).map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br/>')}</p>`).join('')
    : `<p>${esc(L.noSummary)}</p>`;
  return section('hospitalCourse', ctx, {
    text: narrative(text + `<ul>${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`, ctx.language, 'additional'),
  });
}

function dischargeDetailsSection({ encounter, organization }, ctx) {
  const { L } = ctx;
  return section('dischargeDetails', ctx, {
    text: narrative(table([
      [L.discharged, dateTime(encounter.period.end)],
      [L.period, period(encounter.period)],
      [L.unit, organization.name],
    ]), ctx.language),
  });
}

function dischargeMedicationsSection(ctx) {
  return section('dischargeMedications', ctx, {
    text: narrative(`<p>${esc(ctx.L.noMedications)}</p>`, ctx.language),
    emptyReason: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason', code: 'unavailable', display: 'Unavailable' }],
    },
  });
}

// ---------------------------------------------------------------- narrative

function compositionHtml({ patient, encounter, triage, news2, practitioner, organization }, ctx) {
  const { L } = ctx;
  return `<p><b>${esc(L.title)}</b></p>` + table([
    [L.patient, humanName(patient.name)],
    [L.identifier, identifiers(patient.identifier)],
    [L.birthDate, patient.birthDate ?? L.unknown],
    [L.gender, L.genders[patient.gender] ?? patient.gender ?? L.unknown],
    [L.encounter, period(encounter.period)],
    [L.unit, organization.name],
    [L.complaint, display(chiefComplaint(triage))],
    [L.priority, { html: priorityBadge(triage, ctx) }],
    [L.news2Total, news2Summary(news2, ctx)],
    [L.author, `${humanName(practitioner.name)}, ${L.nurse.toLowerCase()}`],
  ]);
}

function triageTable(triage, news2, ctx) {
  const { L } = ctx;
  return table([
    [L.priority, { html: priorityBadge(triage, ctx) }],
    [L.complaint, display(chiefComplaint(triage))],
    [L.news2Total, news2Summary(news2, ctx)],
    ...(triage.note ?? []).map((n) => [L.note, n.text]),
  ]);
}

function news2Table(news2, ctx) {
  const { L } = ctx;
  const rows = (news2.component ?? []).map((c) => [codeName(c.code, ctx, true), String(c.valueInteger ?? '')]);
  if (!rows.length) return '';
  return `<table><thead><tr><th>${esc(L.news2)}: ${esc(L.parameter)}</th><th>${esc(L.score)}</th></tr></thead><tbody>`
    + rows.map(([n, v]) => `<tr><td>${esc(n)}</td><td>${esc(v)}</td></tr>`).join('')
    + `</tbody></table>`;
}

function vitalsTable(vitals, ctx) {
  const { L } = ctx;
  return `<table><thead><tr><th>${esc(L.parameter)}</th><th>${esc(L.value)}</th><th>${esc(L.time)}</th></tr></thead><tbody>`
    + vitals.map((o) => `<tr><td>${esc(codeName(o.code, ctx))}</td><td>${esc(observationValue(o, ctx))}</td>`
      + `<td>${esc(dateTime(o.effectiveDateTime))}</td></tr>`).join('')
    + `</tbody></table>`;
}

function encounterHtml(e, ctx, names) {
  const { L } = ctx;
  return table([
    [L.status, L.statuses[e.status] ?? e.status],
    [L.class, L.classes[e.class?.code] ?? e.class?.display ?? e.class?.code],
    [L.period, period(e.period)],
    [L.reason, (e.reasonCode ?? []).map(display).join(', ')],
    [L.unit, names.organization],
  ]);
}

function resourceHtml(r, ctx, names) {
  const { L } = ctx;
  switch (r.resourceType) {
    case 'Patient':
      return table([[L.patient, humanName(r.name)], [L.identifier, identifiers(r.identifier)],
        [L.birthDate, r.birthDate ?? L.unknown], [L.gender, L.genders[r.gender] ?? r.gender ?? L.unknown]]);
    case 'Practitioner':
      return table([[L.practitioner, humanName(r.name)], [L.identifier, identifiers(r.identifier)]]);
    case 'Organization':
      return table([[L.organization, r.name], [L.identifier, identifiers(r.identifier)]]);
    case 'PractitionerRole':
      return table([[L.practitioner, names.practitioner], [L.role, (r.code ?? []).map(display).join(', ')],
        [L.organization, names.organization]]);
    case 'Observation':
      return table([[codeName(r.code, ctx), observationValue(r, ctx)], [L.time, dateTime(r.effectiveDateTime)]]);
    default:
      return `<p>${esc(r.resourceType)}</p>`;
  }
}

function narrative(html, language, status = 'generated') {
  return { status, div: `<div xmlns="${XHTML}" lang="${esc(language)}" xml:lang="${esc(language)}">${html}</div>` };
}

// Two-column table of [label, value] rows; a value is text, or { html } that is already escaped
function table(rows) {
  return `<table><tbody>${rows.filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${v.html ?? esc(v)}</td></tr>`).join('')}</tbody></table>`;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// ---------------------------------------------------------------- values

function chiefComplaint(triage) {
  return triage.component?.find((c) => c.code?.coding?.some((cd) => cd.system === SCT && cd.code === CHIEF_COMPLAINT))
    ?.valueCodeableConcept;
}

function priorityName(triage, { L }) {
  const coding = triage.valueCodeableConcept?.coding?.[0];
  if (L === LABELS.en && PRIORITY[coding?.code]) return PRIORITY[coding.code].en;
  return display(triage.valueCodeableConcept);
}

function priorityBadge(triage, ctx) {
  const p = PRIORITY[triage.valueCodeableConcept?.coding?.[0]?.code];
  const name = esc(priorityName(triage, ctx));
  return p ? `<span style="background-color: ${p.colour}; color: ${p.text}; padding: 0 0.4em; font-weight: bold">${name}</span>` : name;
}

function news2Summary(news2, { L }) {
  const total = news2.valueInteger;
  if (total == null) return L.unknown;
  const single3 = (news2.component ?? []).some((c) => c.valueInteger === 3);
  const risk = total >= 7 ? 'high' : total >= 5 ? 'medium' : single3 ? 'lowMedium' : 'low';
  return `${total} (${L.risk}: ${L.risks[risk]})`;
}

function observationValue(o, ctx) {
  if (o.valueQuantity) {
    const q = quantity(o.valueQuantity);
    return o.valueQuantity.code === 'L/min' && o.valueQuantity.value === 0 ? `${q} (${ctx.L.roomAir})` : q;
  }
  if (o.valueCodeableConcept) return display(o.valueCodeableConcept);
  if (o.valueInteger != null) return String(o.valueInteger);
  if (o.valueString) return o.valueString;
  const comps = o.component ?? [];
  const sys = comps.find((c) => c.code?.coding?.some((cd) => cd.code === '8480-6'))?.valueQuantity;
  const dia = comps.find((c) => c.code?.coding?.some((cd) => cd.code === '8462-4'))?.valueQuantity;
  if (sys && dia) return `${sys.value}/${dia.value} ${dia.unit ?? dia.code ?? ''}`.trim();
  return comps.map((c) => `${codeName(c.code, ctx)}: ${observationValue(c, ctx)}`).join(', ');
}

function quantity(q) {
  return `${q.value ?? ''} ${q.unit ?? q.code ?? ''}`.trim();
}

// Readable name of an observation or component code in the narrative language
function codeName(cc, { L }, short = false) {
  const codings = cc?.coding ?? [];
  const sct = codings.find((c) => c.system === SCT);
  if (L === LABELS.en) {
    return EN_NAMES[sct?.code] ?? codings.find((c) => c.system === LOINC)?.display ?? display(cc);
  }
  let name = SV_NAMES[sct?.code] ?? sct?.display ?? display(cc);
  if (short && name.includes(', ')) name = name.slice(name.lastIndexOf(', ') + 2); // "poäng enligt ... NEWS2 ..., pulsfrekvens"
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function display(cc) {
  if (!cc) return '';
  return cc.text ?? cc.coding?.find((c) => c.display)?.display ?? cc.coding?.[0]?.code ?? '';
}

function humanName(names) {
  const n = names?.find((x) => x.use === 'official') ?? names?.[0];
  if (!n) return '';
  return n.text ?? [...(n.given ?? []), n.family].filter(Boolean).join(' ');
}

function identifiers(ids) {
  return (ids ?? []).map((i) => i.value).filter(Boolean).join(', ');
}

// "2026-11-19T08:42:00+01:00" -> "2026-11-19 08:42 +01:00"; keeps the time zone of the source
function dateTime(s) {
  if (!s) return '';
  const m = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/.exec(s);
  if (!m) return s;
  return [m[1], m[2], m[3] === 'Z' ? 'UTC' : m[3]].filter(Boolean).join(' ');
}

function period(p) {
  if (!p) return '';
  return `${dateTime(p.start)} – ${dateTime(p.end)}`.trim();
}

function compareDateTime(a, b) {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  return Number.isNaN(ta) || Number.isNaN(tb) ? 0 : ta - tb;
}

// ---------------------------------------------------------------- helpers

function documentLanguage(requested, resources) {
  const languages = [...new Set(resources.map((r) => r.language).filter(Boolean))];
  const language = requested ?? languages[0] ?? 'sv';
  const base = (l) => l.split('-')[0].toLowerCase();
  const conflict = languages.find((l) => base(l) !== base(language));
  // bdl-hdr-2: every resource in the document has the language of the Bundle
  if (conflict) {
    throw new Error(`dischargeReport: the resources are in ${languages.join(', ')}; a document in ${language} cannot hold them`);
  }
  return language;
}

function absent(code) {
  return { url: DATA_ABSENT, valueCode: code };
}

// Rewrites references to resources in the document to their urn:uuid, and, when the server base
// is known, relative references to resources outside the document to absolute URLs.
function rewriteReferences(node, fullUrls, fhirBase) {
  if (Array.isArray(node)) {
    node.forEach((n) => rewriteReferences(n, fullUrls, fhirBase));
    return;
  }
  if (!node || typeof node !== 'object') return;
  if (typeof node.reference === 'string' && !node.reference.startsWith('#') && !node.reference.startsWith('urn:')) {
    const m = /(?:^|\/)([A-Z][A-Za-z]+)\/([A-Za-z0-9\-.]{1,64})(?:\/_history\/[A-Za-z0-9\-.]{1,64})?$/.exec(node.reference);
    const isRelative = !/^[a-z][a-z0-9+.-]*:/i.test(node.reference);
    const sameServer = isRelative || (fhirBase && node.reference.startsWith(fhirBase.replace(/\/$/, '') + '/'));
    if (m && sameServer && fullUrls.has(`${m[1]}/${m[2]}`)) {
      node.reference = fullUrls.get(`${m[1]}/${m[2]}`);
    } else if (isRelative && fhirBase) {
      node.reference = `${fhirBase.replace(/\/$/, '')}/${node.reference}`;
    }
  }
  for (const [k, v] of Object.entries(node)) {
    if (k !== 'text' && typeof v === 'object') rewriteReferences(v, fullUrls, fhirBase);
  }
}

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function isUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s);
}

function randomUuid() {
  return globalThis.crypto.randomUUID();
}

// A name-based UUID (version 8, RFC 9562) from a string, so that a resource gets the same
// urn:uuid in every document and the output is reproducible. Not cryptographic.
function uuidFrom(s) {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < s.length; i++) {
    const k = s.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4; h2 ^= h1; h3 ^= h1; h4 ^= h1;
  const hex = [h1, h2, h3, h4].map((h) => (h >>> 0).toString(16).padStart(8, '0')).join('');
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
