import type { Bundle, CompositionSection, Encounter, FhirResource, Observation, Organization, Patient, Practitioner, QuestionnaireResponse } from 'fhir/r4';
import { absoluteBase, MOCK } from './config';
import { loadLib, uuid } from './libs';
import { acvpuLetter } from './news2';

export interface DischargeReportArgs {
  patient: Patient;
  encounter: Encounter;
  author: Practitioner;
  organization: Organization;
  vitals: Observation[];
  news2: Observation[];
  triage: Observation[];
  questionnaireResponse?: QuestionnaireResponse;
}

/** demo/lib/hdr.js, as the contract in demo/README.md has it. */
export interface HdrModule {
  dischargeReport(args: DischargeReportArgs): Bundle | Promise<Bundle>;
}

/** An HL7 Europe Hospital Discharge Report (document Bundle) for the stay. */
export async function dischargeReport(args: DischargeReportArgs): Promise<Bundle> {
  if (MOCK) return mockDischargeReport(args);
  const lib = await loadLib<HdrModule>('hdr');
  return lib.dischargeReport(args);
}

/* ------------------------------------------------------------------ mock mode */

const LOINC = 'http://loinc.org';
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const div = (html: string) => ({ status: 'generated' as const, div: `<div xmlns="http://www.w3.org/1999/xhtml">${html}</div>` });
const time = (iso?: string) => (iso ? new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' }) : '–');

function vitalText(o: Observation): string {
  if (o.valueQuantity) return `${o.valueQuantity.value} ${o.valueQuantity.unit ?? ''}`.trim();
  if (o.component) return o.component.map((c) => c.valueQuantity?.value).join('/') + ' mmHg';
  if (o.valueCodeableConcept) return acvpuLetter(o.valueCodeableConcept.coding?.[0]?.code);
  return '–';
}

function mockDischargeReport(a: DischargeReportArgs): Bundle {
  // The entries keep their server ids; fullUrl is the server URL, so "Patient/x" resolves.
  const all: FhirResource[] = [a.patient, a.author, a.organization, a.encounter, ...a.vitals, ...a.news2, ...a.triage];
  const refTo = (r: FhirResource) => ({ reference: `${r.resourceType}/${r.id}` });
  const fullUrl = (r: FhirResource) => `${absoluteBase()}/${r.resourceType}/${r.id}`;

  const lastTriage = a.triage.at(-1);
  const lastNews2 = a.news2.at(-1);
  const priority = lastTriage?.valueCodeableConcept?.coding?.[0]?.display ?? '–';
  const complaint = lastTriage?.component?.[0]?.valueCodeableConcept?.coding?.[0]?.display ?? '–';

  const sections: CompositionSection[] = [
    {
      title: 'Admission evaluation',
      code: { coding: [{ system: LOINC, code: '67852-4', display: 'Hospital Admission evaluation note' }] },
      text: div(
        a.triage.length
          ? a.triage
              .map(
                (t) =>
                  `<p>Triaged with WEST-A at ${esc(time(t.effectiveDateTime))}: priority <b>${esc(t.valueCodeableConcept?.coding?.[0]?.display ?? '–')}</b>, chief complaint ${esc(t.component?.[0]?.valueCodeableConcept?.coding?.[0]?.display ?? '–')}.${t.note?.[0]?.text ? ' ' + esc(t.note[0].text) : ''}</p>`,
              )
              .join('')
          : '<p>No triage recorded.</p>',
      ),
      entry: a.triage.map(refTo),
    },
    {
      title: 'Vital signs',
      code: { coding: [{ system: LOINC, code: '8716-3', display: 'Vital signs' }] },
      text: div(
        `<table><thead><tr><th>Measured</th><th>Parameter</th><th>Value</th></tr></thead><tbody>${a.vitals
          .map((o) => `<tr><td>${esc(time(o.effectiveDateTime))}</td><td>${esc(o.code.coding?.[0]?.display ?? '')}</td><td>${esc(vitalText(o))}</td></tr>`)
          .join('')}${a.news2
          .map((o) => `<tr><td>${esc(time(o.effectiveDateTime))}</td><td>NEWS2 total score</td><td>${o.valueInteger ?? '–'}</td></tr>`)
          .join('')}</tbody></table>`,
      ),
      entry: [...a.vitals, ...a.news2].map(refTo),
    },
    {
      title: 'Hospital course',
      code: { coding: [{ system: LOINC, code: '8648-8', display: 'Hospital course Narrative' }] },
      text: div(
        `<p>Emergency department visit from ${esc(time(a.encounter.period?.start))} to ${esc(time(a.encounter.period?.end))}. ` +
          `Chief complaint ${esc(complaint)}; WEST-A priority ${esc(priority)}` +
          (lastNews2 ? `, NEWS2 ${lastNews2.valueInteger ?? '–'} at the last triage.` : '.') +
          `</p>`,
      ),
      entry: [refTo(a.encounter)],
    },
  ];

  const composition: FhirResource = {
    resourceType: 'Composition',
    meta: { profile: ['http://hl7.eu/fhir/hdr/StructureDefinition/composition-eu-hdr'] },
    status: 'final',
    type: { coding: [{ system: LOINC, code: '34105-7', display: 'Hospital Discharge summary' }] },
    subject: refTo(a.patient),
    encounter: refTo(a.encounter),
    date: new Date().toISOString(),
    author: [refTo(a.author)],
    custodian: refTo(a.organization),
    title: 'Hospital Discharge Report',
    section: sections,
  };

  return {
    resourceType: 'Bundle',
    meta: { profile: ['http://hl7.eu/fhir/hdr/StructureDefinition/bundle-eu-hdr'] },
    identifier: { system: 'urn:ietf:rfc:3986', value: uuid() },
    type: 'document',
    timestamp: new Date().toISOString(),
    entry: [
      { fullUrl: uuid(), resource: composition },
      ...all.map((r) => ({ fullUrl: fullUrl(r), resource: r })),
    ],
  };
}
