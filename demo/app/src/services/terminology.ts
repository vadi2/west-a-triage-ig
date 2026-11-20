import type { CodeSystem, CodeSystemConcept, Coding, Questionnaire, QuestionnaireItem, ValueSet } from 'fhir/r4';
import { entries, type FhirClient } from './fhirClient';
import { ACVPU } from './news2';

// The renderer would expand each answerValueSet with ValueSet/$expand on a terminology
// server. The demo HAPI cannot expand a value set that includes a whole code system (its
// full-text index is off), and it has no SNOMED CT for the displays of the ACVPU codes. So
// the app expands the guide's few small value sets itself, from the ValueSet and CodeSystem
// resources on the server, and hands the renderer a Questionnaire with answerOptions.

// SNOMED CT is not on the demo server: the terms of the ACVPU codes the guide uses
const KNOWN: Record<string, string> = Object.fromEntries(ACVPU.map((a) => [`http://snomed.info/sct|${a.code}`, a.display]));

export async function withAnswerOptions(q: Questionnaire, client: FhirClient): Promise<Questionnaire> {
  const urls = new Set<string>();
  const collect = (items: QuestionnaireItem[] = []) =>
    items.forEach((i) => {
      if (i.answerValueSet && !i.answerValueSet.startsWith('#')) urls.add(i.answerValueSet);
      collect(i.item);
    });
  collect(q.item);
  const expanded = new Map<string, Coding[]>();
  for (const url of urls) expanded.set(url, await expand(url, client));

  const rewrite = (items: QuestionnaireItem[] = []): QuestionnaireItem[] =>
    items.map(({ answerValueSet, ...i }) => ({
      ...i,
      ...(answerValueSet && expanded.has(answerValueSet)
        ? { answerOption: expanded.get(answerValueSet)!.map((valueCoding) => ({ valueCoding })) }
        : answerValueSet
          ? { answerValueSet }
          : {}),
      ...(i.item ? { item: rewrite(i.item) } : {}),
    }));
  return { ...q, item: rewrite(q.item) };
}

async function expand(url: string, client: FhirClient): Promise<Coding[]> {
  const [canonical, version] = url.split('|');
  const vs = entries(await client.search<ValueSet>('ValueSet', { url: canonical, ...(version ? { version } : {}) }))[0];
  if (!vs) throw new Error(`ValueSet ${url} is not on the server; load the guide (demo/hapi/load.mjs)`);
  if (vs.expansion?.contains?.length) {
    return vs.expansion.contains.map(({ system, version: v, code, display }) => ({ system, version: v, code, display }));
  }
  const out: Coding[] = [];
  for (const inc of vs.compose?.include ?? []) {
    if (!inc.system || inc.valueSet?.length || inc.filter?.length) {
      throw new Error(`ValueSet ${url}: only plain includes of a system can be expanded here`);
    }
    if (inc.concept?.length) {
      const cs = await codeSystem(inc.system, client);
      for (const c of inc.concept) {
        const display = c.display ?? find(cs?.concept, c.code)?.display ?? KNOWN[`${inc.system}|${c.code}`];
        out.push({ system: inc.system, ...(inc.version ? { version: inc.version } : {}), code: c.code, ...(display ? { display } : {}) });
      }
    } else {
      const cs = await codeSystem(inc.system, client);
      if (!cs) throw new Error(`ValueSet ${url} includes all of ${inc.system}, which is not on the server`);
      const all = (concepts: CodeSystemConcept[] = []): CodeSystemConcept[] =>
        concepts.flatMap((c) => [
          ...(c.property?.some((p) => p.code === 'notSelectable' && p.valueBoolean) ? [] : [c]),
          ...all(c.concept),
        ]);
      for (const c of all(cs.concept)) out.push({ system: inc.system, code: c.code, ...(c.display ? { display: c.display } : {}) });
    }
  }
  return out;
}

const codeSystems = new Map<string, Promise<CodeSystem | undefined>>();

function codeSystem(url: string, client: FhirClient): Promise<CodeSystem | undefined> {
  if (url === 'http://snomed.info/sct') return Promise.resolve(undefined);
  let p = codeSystems.get(url);
  if (!p) {
    p = client.search<CodeSystem>('CodeSystem', { url }).then((b) => entries(b)[0]);
    p.catch(() => codeSystems.delete(url));
    codeSystems.set(url, p);
  }
  return p;
}

function find(concepts: CodeSystemConcept[] | undefined, code: string): CodeSystemConcept | undefined {
  for (const c of concepts ?? []) {
    if (c.code === code) return c;
    const sub = find(c.concept, code);
    if (sub) return sub;
  }
  return undefined;
}
