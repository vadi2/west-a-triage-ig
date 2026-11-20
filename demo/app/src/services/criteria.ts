import type { CodeSystem, CodeSystemConcept, Coding } from 'fhir/r4';
import { IG } from './config';
import { entries, type FhirClient } from './fhirClient';
import { priorityOf, type PriorityCode } from './priority';

export const CRITERION_SYSTEM = `${IG}/CodeSystem/west-a-triage-criterion-cs`;
export const NO_WARNING_SYMPTOMS = '163';
export const NEED_CODES = ['159', '160', '161', '162'];

export interface Criterion {
  code: string;
  /** English designation, else the Swedish display. */
  name: string;
  /** The display of the code system (Swedish), the language of the WEST-A resources. */
  display?: string;
  priority?: PriorityCode;
}

export type Criteria = Map<string, Criterion>;

// The WEST-A triage criterion code system carries the priority each criterion gives (its
// `priority` property), which the board shows as the reason for a warning symptom.
const cache = new WeakMap<FhirClient, Promise<Criteria>>();

export function loadCriteria(client: FhirClient): Promise<Criteria> {
  let p = cache.get(client);
  if (!p) {
    p = (async () => {
      const cs = entries(await client.search<CodeSystem>('CodeSystem', { url: CRITERION_SYSTEM }))[0];
      if (!cs) throw new Error(`CodeSystem ${CRITERION_SYSTEM} is not on the server; load the guide (demo/hapi/load.mjs)`);
      const out: Criteria = new Map();
      const walk = (concepts: CodeSystemConcept[] = []) => {
        for (const c of concepts) {
          const priority = c.property?.find((x) => x.code === 'priority')?.valueCoding;
          out.set(c.code, {
            code: c.code,
            name: c.designation?.find((d) => d.language?.startsWith('en'))?.value ?? c.display ?? c.code,
            display: c.display,
            priority: priorityOf(priority),
          });
          walk(c.concept);
        }
      };
      walk(cs.concept);
      return out;
    })();
    p.catch(() => cache.delete(client));
    cache.set(client, p);
  }
  return p;
}

/** The priority a warning symptom gives; none for a need, which is a floor (yellow), not a symptom. */
export function criterionPriority(criteria: Criteria, code: string): PriorityCode | undefined {
  if (code === NO_WARNING_SYMPTOMS) return '4';
  if (NEED_CODES.includes(code)) return undefined;
  return criteria.get(code)?.priority;
}

/**
 * The criteria as the triage Observation records them: the Questionnaire offers them with
 * English displays, and the Observation is in Swedish (language 'sv'), so each takes the
 * display of the code system.
 */
export function recordedCriteria(codings: Coding[], criteria: Criteria | undefined): Coding[] {
  return codings.map((c) => ({ system: CRITERION_SYSTEM, code: c.code, ...(criteria?.get(c.code ?? '')?.display ? { display: criteria.get(c.code!)!.display } : {}) }));
}

/** Why the warning symptoms and needs give the priority they do, for the board and the reasons. */
export interface CriteriaReasons {
  /** One pin per priority in the priority row. */
  pins: { priority: PriorityCode; label: string }[];
  /** Each warning symptom with the priority it gives. */
  symptoms: { name: string; priority?: PriorityCode }[];
  needs: string[];
  /** The nurse's manual override of the warning symptom priority, if any. */
  override?: PriorityCode;
  /** Warning symptoms assessed: a symptom, "no warning symptoms", or an override. */
  assessed: boolean;
}

export function criteriaReasons(
  answers: { triageCriteria: { code?: string; display?: string }[]; complaintPriority?: { system?: string; code?: string } },
  criteria: Criteria | undefined,
  yellowFloor: boolean,
): CriteriaReasons {
  const symptoms: CriteriaReasons['symptoms'] = [];
  const needs: string[] = [];
  for (const c of answers.triageCriteria) {
    if (!c.code) continue;
    const name = criteria?.get(c.code)?.name ?? c.display ?? c.code;
    if (NEED_CODES.includes(c.code)) needs.push(name);
    else symptoms.push({ name, priority: criteria ? criterionPriority(criteria, c.code) : c.code === NO_WARNING_SYMPTOMS ? '4' : undefined });
  }
  const override = priorityOf(answers.complaintPriority);
  const pins: CriteriaReasons['pins'] = [];
  const byPriority = new Map<PriorityCode, number>();
  for (const s of symptoms) if (s.priority) byPriority.set(s.priority, (byPriority.get(s.priority) ?? 0) + 1);
  const noneOnly = answers.triageCriteria.every((c) => c.code === NO_WARNING_SYMPTOMS || NEED_CODES.includes(c.code ?? ''));
  for (const [priority, n] of [...byPriority].sort()) {
    pins.push({ priority, label: noneOnly ? 'no warning symptom' : n > 1 ? `${n} warning symptoms` : 'warning symptom' });
  }
  if (override) pins.push({ priority: override, label: 'override' });
  if (yellowFloor || needs.length) pins.push({ priority: '3', label: 'lowest for need' });
  return { pins, symptoms, needs, override, assessed: symptoms.some((s) => s.priority) || !!override };
}
