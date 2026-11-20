import type { Coding } from 'fhir/r4';
import { IG } from './config';

export const PRIORITY_SYSTEM = `${IG}/CodeSystem/west-a-triage-priority-cs`;
export const COMPLAINT_SYSTEM = `${IG}/CodeSystem/west-a-chief-complaint-cs`;

export type PriorityCode = '1' | '2' | '3' | '4';
export type Risk = 'high' | 'medium' | 'low-medium' | 'low';

/** Most urgent first, as the code system sorts them. */
export const PRIORITIES: { code: PriorityCode; name: string; en: string; key: string }[] = [
  { code: '1', name: 'Röd', en: 'Red', key: 'rod' },
  { code: '2', name: 'Orange', en: 'Orange', key: 'orange' },
  { code: '3', name: 'Gul', en: 'Yellow', key: 'gul' },
  { code: '4', name: 'Grön', en: 'Green', key: 'gron' },
];

export const priority = (code: PriorityCode | string | undefined) => PRIORITIES.find((p) => p.code === code);

export const priorityCoding = (code: PriorityCode): Coding => ({
  system: PRIORITY_SYSTEM,
  code,
  display: priority(code)!.name,
});

/** The priority code of a coding from the WEST-A code system, or undefined. */
export function priorityOf(coding: Coding | undefined | null): PriorityCode | undefined {
  if (!coding || coding.system !== PRIORITY_SYSTEM) return undefined;
  return PRIORITIES.some((p) => p.code === coding.code) ? (coding.code as PriorityCode) : undefined;
}

/** WEST-A p. 6: the colour of each NEWS2 clinical risk band (as WestATriage.cql). */
export const RISK_PRIORITY: Record<Risk, PriorityCode> = {
  high: '1',
  medium: '2',
  'low-medium': '3',
  low: '4',
};

export const RISK_TEXT: Record<Risk, string> = {
  high: 'high',
  medium: 'medium',
  'low-medium': 'low–medium',
  low: 'low',
};

/**
 * Which priorities the nurse may record against the proposed one. The clinical assessment can
 * raise the priority; a red or orange patient is never lowered (WEST-A p. 8), and yellow as
 * lowest priority for a need or process (pp. 46-48) is a floor too.
 */
export function allowed(proposed: PriorityCode | undefined, yellowFloor: boolean): Record<PriorityCode, string | null> {
  const out = { '1': null, '2': null, '3': null, '4': null } as Record<PriorityCode, string | null>;
  if (!proposed) return out;
  for (const p of PRIORITIES) {
    if (p.code <= proposed) continue;
    if (proposed === '1' || proposed === '2') {
      out[p.code] = 'the clinical assessment never lowers a red or orange patient (WEST-A p. 8)';
    } else if (yellowFloor && p.code === '4') {
      out[p.code] = 'Gul is the lowest priority for this need or process (WEST-A pp. 46–48)';
    }
  }
  return out;
}
