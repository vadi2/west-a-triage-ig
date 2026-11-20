import type { Encounter, Observation, Patient } from 'fhir/r4';
import { client } from './cds';
import { profile } from './config';
import { entries } from './fhirClient';

export const LRID_SYSTEM = 'https://fhir.vgregion.se/NamingSystem/LRID';
const HTEST = { system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason', code: 'HTEST', display: 'test health data' };
export const TRIAGE_CODE = 'http://snomed.info/sct|425705009';
export const NEWS2_CODE = 'http://snomed.info/sct|1104051000000101';

export async function findPatients(text: string): Promise<Patient[]> {
  const q = text.trim();
  const params: Record<string, string> = { _count: '40', _sort: '-_lastUpdated' };
  if (/^\d{6,}|^\d{8}[MK]/i.test(q)) params.identifier = q.replace(/-/g, '');
  else if (q) params.name = q;
  return entries(await client.search<Patient>('Patient', params));
}

/** The latest triage of each patient in the list, by patient id. */
export async function latestTriages(): Promise<Map<string, Observation>> {
  const found = entries(await client.search<Observation>('Observation', { code: TRIAGE_CODE, _sort: '-date', _count: '200' }));
  const out = new Map<string, Observation>();
  for (const o of found) {
    const id = o.subject?.reference?.split('/').pop();
    if (id && !out.has(id)) out.set(id, o);
  }
  return out;
}

const FIRST_F = ['Elin', 'Saga', 'Aisha', 'Ingrid', 'Malin', 'Leyla', 'Britt', 'Hanna', 'Sofia', 'Gunilla'];
const FIRST_M = ['Oskar', 'Mehmet', 'Lars', 'Nils', 'Ali', 'Göran', 'Viktor', 'Johan', 'Arvid', 'Kent'];
const FAMILY = ['Karlsson', 'Johansson', 'Lindqvist', 'Yilmaz', 'Abdi', 'Sandberg', 'Ek', 'Fransson', 'Nyström', 'Hassan', 'Svensson', 'Bergström'];

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

export function randomPatientDraft(): PatientDraft {
  const gender = Math.random() < 0.5 ? 'female' : 'male';
  const year = 1935 + Math.floor(Math.random() * 70);
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  return {
    given: pick(gender === 'female' ? FIRST_F : FIRST_M),
    family: pick(FAMILY),
    gender,
    birthDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}

export interface PatientDraft {
  given: string;
  family: string;
  gender: 'female' | 'male' | 'other' | 'unknown';
  birthDate: string;
}

/**
 * A VGR local reserve number (LRID) in the shape of the guide's example: the birth date, K for
 * a woman or M for a man (X otherwise), and a three-digit sequence number. Synthetic patients
 * get one, and a test-data tag, so no real identity is ever used.
 */
export function reserveNumber(d: PatientDraft): string {
  const sex = d.gender === 'female' ? 'K' : d.gender === 'male' ? 'M' : 'X';
  const seq = String(900 + Math.floor(Math.random() * 100));
  return `${d.birthDate.replace(/-/g, '')}${sex}${seq}`;
}

export async function createSyntheticPatient(d: PatientDraft): Promise<Patient> {
  return client.create<Patient>({
    resourceType: 'Patient',
    meta: { profile: [profile('west-a-patient')], tag: [HTEST] },
    language: 'sv',
    identifier: [{ use: 'temp', system: LRID_SYSTEM, value: reserveNumber(d) }],
    name: [{ use: 'official', family: d.family.trim(), given: [d.given.trim()], text: `${d.given.trim()} ${d.family.trim()}` }],
    gender: d.gender,
    birthDate: d.birthDate,
  });
}

/** The patient's open visit (the latest one in progress), or a new one. */
export async function openEncounter(patient: Patient): Promise<Encounter> {
  const open = entries(await client.search<Encounter>('Encounter', { subject: `Patient/${patient.id}`, status: 'in-progress' }))
    .sort((a, b) => (b.period?.start ?? '').localeCompare(a.period?.start ?? ''))[0];
  return open ?? startEncounter(patient);
}

/** An emergency department visit, as example-encounter-emergency. */
export async function startEncounter(patient: Patient): Promise<Encounter> {
  return client.create<Encounter>({
    resourceType: 'Encounter',
    meta: { tag: patient.meta?.tag?.some((t) => t.code === 'HTEST') ? [HTEST] : undefined },
    language: 'sv',
    status: 'in-progress',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'EMER', display: 'emergency' },
    subject: { reference: `Patient/${patient.id}` },
    period: { start: nowLocal() },
  });
}

/** Now, as a FHIR dateTime with the local offset (2026-11-19T08:38:00+01:00). */
export function nowLocal(): string {
  const d = new Date();
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(off / 60)}:${pad(off % 60)}`
  );
}

export const isTest = (p: Patient) => !!p.meta?.tag?.some((t) => t.code === 'HTEST');

export function patientName(p: Patient | undefined): string {
  if (!p) return '';
  const n = p.name?.[0];
  return n?.text ?? ([...(n?.given ?? []), n?.family].filter(Boolean).join(' ') || 'Unknown patient');
}

export function patientIdentifier(p: Patient | undefined): { label: string; value: string } | undefined {
  const i = p?.identifier?.[0];
  if (!i?.value) return undefined;
  const label = i.system?.endsWith('personnummer')
    ? 'Personnummer'
    : i.system?.endsWith('samordningsnummer')
      ? 'Samordningsnr'
      : i.system?.includes('LRID')
        ? 'Reserve no.'
        : 'ID';
  const v = i.value;
  const value = /^\d{12}$/.test(v) ? `${v.slice(0, 8)}-${v.slice(8)}` : v;
  return { label, value };
}

export function age(p: Patient | undefined, at = new Date()): number | undefined {
  if (!p?.birthDate) return undefined;
  const [y, m = 1, d = 1] = p.birthDate.split('-').map(Number);
  let a = at.getFullYear() - y;
  if (at.getMonth() + 1 < m || (at.getMonth() + 1 === m && at.getDate() < d)) a--;
  return a;
}
