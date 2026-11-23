import { useEffect, useMemo, useState } from 'react';
import type { Bundle, Observation, Questionnaire, QuestionnaireResponse } from 'fhir/r4';
import {
  BaseRenderer,
  buildForm,
  getResponse,
  removeEmptyAnswersFromResponse,
  removeInternalIdsFromResponse,
  useQuestionnaireResponseStore,
} from '@aehrc/smart-forms-renderer';
import type { Stay } from '../App';
import { ErrorNote } from '../components/ErrorNote';
import { Pinboard } from '../components/Pinboard';
import { Samples } from '../components/Samples';
import { RendererTheme } from '../theme';
import { readAnswers } from '../services/answers';
import { client, news2Observation, runTriage, type TriageResult } from '../services/cds';
import { criteriaReasons, loadCriteria, NEED_CODES, NO_WARNING_SYMPTOMS, type Criteria } from '../services/criteria';
import { ENGINE_TEXT, useEngine } from '../services/backend';
import { NURSE, QUESTIONNAIRE_ID, QUESTIONNAIRE_URL } from '../services/config';
import { conformance } from '../services/conformance';
import { extractVitals } from '../services/extract';
import { news2, sliceLabel } from '../services/news2';
import { mostUrgent, priority, priorityOf, RISK_PRIORITY, RISK_TEXT } from '../services/priority';
import { clock } from '../components/format';
import { nowLocal } from '../services/patients';
import { scenarioResponse, TRIAGE_SCENARIOS, type TriageScenario } from '../services/samples';
import { withAnswerOptions } from '../services/terminology';
import { ResourceRef } from '../components/ResourceRef';

type StepState = 'waiting' | 'running' | 'done' | 'failed';
const STEP_NAMES = [
  'Save the form (QuestionnaireResponse)',
  'Extract the vital signs (SDC template extraction)',
  'Save the vital sign Observations',
  'Run the WEST-A guideline (PlanDefinition/$apply, Library/$evaluate)',
] as const;
const BROWSER_STEP = 'Run the WEST-A guideline (its CQL, in this browser)';

export function TriageFormScreen({ stay, onDone }: { stay: Stay; onDone: (s: Stay) => void }) {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | undefined>(stay.questionnaire);
  const [formQuestionnaire, setFormQuestionnaire] = useState<Questionnaire | undefined>();
  const [criteria, setCriteria] = useState<Criteria | undefined>();
  const [loadError, setLoadError] = useState<unknown>();
  const [ready, setReady] = useState(false);
  const [steps, setSteps] = useState<StepState[] | undefined>();
  const [startedAt, setStartedAt] = useState<number | undefined>();
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<unknown>();
  const [incomplete, setIncomplete] = useState<string | undefined>();
  // The vitals saved before all seven were known ("Save vitals so far"), and what the server said
  const [partial, setPartial] = useState<SavedSoFar | undefined>();
  const [partialBusy, setPartialBusy] = useState(false);
  const [partialError, setPartialError] = useState<unknown>();
  // Bumped once a filled-in form has rendered, see fillScenario
  const [filled, setFilled] = useState(0);
  const engine = useEngine();
  // This triage is scored on the vital signs measured from now on, not on those of an earlier
  // triage of the patient (to the whole second before: the observations keep whole seconds)
  const [measuredSince] = useState(() => new Date(Math.floor(Date.now() / 1000) * 1000 - 1000).toISOString());

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        // The Questionnaire as published (with its extraction templates), and the same with
        // its value sets expanded for the renderer (see services/terminology.ts)
        const q = stay.questionnaire ?? (await conformance.read<Questionnaire>('Questionnaire', QUESTIONNAIRE_ID));
        const [formQ, crit] = await Promise.all([withAnswerOptions(q, conformance), loadCriteria(conformance)]);
        if (!live) return;
        setQuestionnaire(q);
        setFormQuestionnaire(formQ);
        setCriteria(crit);
        await build(formQ);
        if (live) setReady(true);
      } catch (e) {
        if (live) setLoadError(e);
      }
    })();
    return () => {
      live = false;
    };
  }, [stay.questionnaire]);

  // A clock for the guideline step, which takes several seconds on the server
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [startedAt]);

  const response = useQuestionnaireResponseStore.use.updatableResponse();
  const answers = useMemo(
    () => readAnswers(formQuestionnaire && response ? removeEmptyAnswersFromResponse(formQuestionnaire, response) : response),
    [response, formQuestionnaire, filled],
  );
  const preview = useMemo(() => news2(answers), [answers]);
  const reasons = useMemo(() => criteriaReasons(answers, criteria), [answers, criteria]);
  // The priority so far, by the rules of WestATriage.cql ("Provisional Proposed Priority"): the
  // most urgent of the NEWS2 colour so far, the warning symptoms and override, and yellow for a
  // need. Final only once NEWS2 is complete and the warning symptoms are assessed.
  const lead = useMemo(() => {
    const vital = preview.provisional.risk ? RISK_PRIORITY[preview.provisional.risk] : undefined;
    const code = mostUrgent(vital, ...reasons.symptoms.map((x) => x.priority), reasons.override, reasons.needs.length ? '3' : undefined);
    return code ? { code, final: preview.total !== null && reasons.assessed } : undefined;
  }, [preview, reasons]);

  async function build(q: Questionnaire, qr?: QuestionnaireResponse) {
    await buildForm({
      questionnaire: q,
      questionnaireResponse: qr,
      rendererConfigOptions: {
        hideQuestionnaireTitle: true,
        textFieldWidth: 200,
        itemResponsive: { labelBreakpoints: { xs: 12, md: 5 }, fieldBreakpoints: { xs: 12, md: 7 }, columnGapPixels: 16, rowGapPixels: 6 },
        showTabbedFormAt: { query: 'up', start: 'xl' },
        requiredIndicatorPosition: 'end',
      },
    });
  }

  function readDraft() {
    const raw = getResponse();
    const draft = removeInternalIdsFromResponse(formQuestionnaire!, removeEmptyAnswersFromResponse(formQuestionnaire!, raw));
    return { draft, a: readAnswers(draft) };
  }

  /**
   * Saves the form and posts the vital signs it gives. After a save of the vitals so far, the
   * same QuestionnaireResponse is updated, and a vital sign already posted with the same value
   * is not posted again: the guideline takes the latest of each.
   */
  async function saveVitals(draft: QuestionnaireResponse, status: QuestionnaireResponse['status'], done: () => void) {
    const qr: QuestionnaireResponse = {
      ...draft,
      ...(partial ? { id: partial.response.id } : {}),
      questionnaire: `${QUESTIONNAIRE_URL}|${questionnaire!.version ?? '0.1.0'}`,
      status,
      subject: { reference: `Patient/${stay.patient.id}` },
      encounter: { reference: `Encounter/${stay.encounter.id}` },
      author: { reference: `Practitioner/${NURSE.id}` },
      authored: nowLocal(),
    };
    const saved = partial ? await client.update(qr) : await client.create(qr);
    done();

    const bundle = await extractVitals(questionnaire!, saved);
    if (bundle.type !== 'transaction' || !bundle.entry?.length) {
      throw new Error(`extractVitals gave a ${bundle.type} Bundle with ${bundle.entry?.length ?? 0} entries; expected a transaction with the vital signs`);
    }
    const earlier = partial?.vitals ?? [];
    const fresh: Bundle = {
      ...bundle,
      entry: bundle.entry.filter((e) => !earlier.some((o) => sameMeasurement(o, e.resource as Observation))),
    };
    done();

    const posted = fresh.entry!.length ? await savedObservations(fresh, await client.transaction(fresh)) : [];
    const vitals = [...earlier.filter((o) => !posted.some((n) => code(n) === code(o))), ...posted];
    done();
    return { saved, vitals, posted };
  }

  async function savePartial() {
    if (!questionnaire || !formQuestionnaire) return;
    const { draft, a } = readDraft();
    const n = news2(a);
    if (n.provisional.total === null || n.total !== null) return;
    if (a.systolic !== undefined && a.diastolic === undefined) {
      setIncomplete('Give the diastolic blood pressure with the systolic one, or clear the systolic one, before saving.');
      return;
    }
    setIncomplete(undefined);
    setPartialError(undefined);
    setPartialBusy(true);
    try {
      const { saved, vitals, posted } = await saveVitals(draft, 'in-progress', () => {});
      const result = await runTriage({
        patientId: stay.patient.id!,
        encounterId: stay.encounter.id!,
        practitionerId: NURSE.id,
        complaintPriority: a.complaintPriority ?? null,
        scale2: a.scale2,
        triageCriteria: a.triageCriteria,
        measuredSince,
      });
      // A preliminary NEWS2 of the scores known so far; none again when no vital sign changed
      let n2 = partial?.news2;
      if (result.provisional.total !== null && result.provisional.missing.length && (posted.length || !n2)) {
        n2 = await client.create(
          news2Observation({
            news2: result.news2,
            provisional: result.provisional,
            patientId: stay.patient.id!,
            encounterId: stay.encounter.id!,
            performerId: NURSE.id,
            effectiveDateTime: nowLocal(),
          }),
        );
      }
      setPartial({ response: saved, vitals, result, news2: n2, at: nowLocal() });
    } catch (e) {
      setPartialError(e);
    } finally {
      setPartialBusy(false);
    }
  }

  async function submit() {
    if (!questionnaire || !formQuestionnaire) return;
    setError(undefined);
    const { draft, a } = readDraft();
    const r = criteriaReasons(a, criteria);
    const missing = [
      news2(a).total === null && 'all seven vital parameters (or save the vitals so far)',
      a.systolic !== undefined && a.diastolic === undefined && 'the diastolic blood pressure (with the systolic one)',
      !a.chiefComplaint && 'the chief complaint',
      a.chiefComplaint && !r.assessed && 'its warning symptoms (tick them, or "No warning symptoms")',
    ].filter(Boolean);
    // "No warning symptoms" (163) with a warning symptom contradicts itself; needs may go with it
    const symptoms = a.triageCriteria.filter((c) => c.code !== NO_WARNING_SYMPTOMS && !NEED_CODES.includes(c.code ?? ''));
    if (symptoms.length && a.triageCriteria.some((c) => c.code === NO_WARNING_SYMPTOMS)) {
      setIncomplete(
        `"No warning symptoms" is ticked together with ${symptoms.length > 1 ? `${symptoms.length} warning symptoms` : 'a warning symptom'}. Untick one or the other.`,
      );
      return;
    }
    if (missing.length) {
      setIncomplete(`The guideline needs ${missing.join(', ')} before it can propose a priority.`);
      useQuestionnaireResponseStore.getState().highlightRequiredItems();
      return;
    }
    setIncomplete(undefined);

    const state: StepState[] = ['running', 'waiting', 'waiting', 'waiting'];
    const mark = (i: number, s: StepState) => {
      state[i] = s;
      if (s === 'done' && i + 1 < state.length) state[i + 1] = 'running';
      setSteps([...state]);
      setStartedAt(s === 'done' && i + 1 < state.length ? Date.now() : undefined);
    };
    setSteps([...state]);
    setStartedAt(Date.now());
    let i = 0;
    try {
      const { saved, vitals } = await saveVitals(draft, 'completed', () => mark(i++, 'done'));

      const triage = await runTriage({
        patientId: stay.patient.id!,
        encounterId: stay.encounter.id!,
        practitionerId: NURSE.id,
        complaintPriority: a.complaintPriority ?? null,
        scale2: a.scale2,
        triageCriteria: a.triageCriteria,
        measuredSince,
      });
      mark(i++, 'done');

      onDone({ ...stay, questionnaire, response: saved, answers: a, vitals, result: triage, recorded: undefined });
    } catch (e) {
      mark(i, 'failed');
      setError(e);
    }
  }

  function fillScenario(scenario: TriageScenario) {
    if (!formQuestionnaire) return;
    setIncomplete(undefined);
    // Right after buildForm the renderer has not yet worked out which items its enableWhen
    // shows, so removeEmptyAnswersFromResponse drops the triage criteria: read them again
    // once the form has rendered.
    void build(formQuestionnaire, scenarioResponse(scenario)).then(() => setTimeout(() => setFilled((n) => n + 1), 300));
  }

  if (loadError) return <ErrorNote error={loadError} what={`Loading Questionnaire/${QUESTIONNAIRE_ID} and its terminology`} />;

  const seconds = startedAt ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0;

  return (
    <div className="form-screen">
      <section className="form-col" aria-labelledby="form-title">
        <div className="form-top">
          <h1 id="form-title">WEST-A triage form</h1>
        </div>
        <Samples>
          {TRIAGE_SCENARIOS.map((s) => (
            <button key={s.id} type="button" title={s.title} onClick={() => fillScenario(s)} disabled={!ready || !!steps}>
              {s.label}
              <span className="sr-only">: {s.title}</span>
            </button>
          ))}
        </Samples>
        {!ready ? (
          <p className="quiet">Loading the Questionnaire…</p>
        ) : (
          <div className="renderer">
            <RendererTheme>
              <BaseRenderer />
            </RendererTheme>
          </div>
        )}
        {incomplete && (
          <p className="error" role="alert">
            {incomplete}
          </p>
        )}
        <div className="submit-row row">
          <button type="button" className="primary big" onClick={submit} disabled={!ready || (!!steps && !error) || partialBusy}>
            Save and run the guideline
          </button>
          <button
            type="button"
            className="big"
            onClick={savePartial}
            disabled={!ready || !!steps || partialBusy || preview.total !== null || preview.provisional.total === null}
            title="Save the vital signs measured so far and record a preliminary NEWS2"
          >
            {partialBusy ? 'Saving the vitals so far…' : 'Save vitals so far'}
          </button>
        </div>
        {partial && <PartialSaved partial={partial} />}
        <ErrorNote error={partialError} what="Saving the vitals so far" />
        {steps && (
          <ol className="steps" aria-live="polite">
            {STEP_NAMES.map((step, n) => [n === 3 && engine === 'browser' ? BROWSER_STEP : step, n] as const).map(([name, n]) => (
              <li key={name} className={`step-${steps[n]}`}>
                <span className="step-mark" aria-hidden="true">
                  {steps[n] === 'done' ? '✓' : steps[n] === 'failed' ? '✕' : steps[n] === 'running' ? '…' : '·'}
                </span>
                {name}
                {steps[n] === 'running' && n === 3 && (
                  <span className="num step-time">
                    {' '}
                    {seconds} s{engine === 'server' ? ' (the server takes 5–15 s)' : ''}
                  </span>
                )}
                <span className="sr-only"> — {steps[n]}</span>
              </li>
            ))}
          </ol>
        )}
        <ErrorNote error={error} what="Saving the triage" />
      </section>
      <aside className="preview-col" aria-label="NEWS2 while you type">
        <Pinboard
          answers={answers}
          news2={preview}
          lead={lead}
          sources={reasons.pins}
          caption={
            <>
              <strong>While you type</strong> · counted here in the browser. The {engine ? ENGINE_TEXT[engine] : 'guideline'} gives the
              priority.
            </>
          }
        />
      </aside>
      <p className="phone-tally" aria-live="polite">
        {preview.total !== null ? (
          <>
            NEWS2: <strong className="num">{preview.total}</strong> · {RISK_TEXT[preview.risk!]}
          </>
        ) : (
          <>
            NEWS2 so far: <strong className="num">{preview.provisional.total === null ? '–' : `≥ ${preview.provisional.total}`}</strong>
            {preview.provisional.risk ? ` · at least ${RISK_TEXT[preview.provisional.risk]}` : ''}
          </>
        )}
        {lead && ` · ${lead.final ? '' : 'at least '}${priority(lead.code)!.name}`}
      </p>
    </div>
  );
}

/** The saved vitals: read from the transaction response, or fetched by their locations. */
async function savedObservations(sent: Bundle, result: Bundle): Promise<Observation[]> {
  const out: Observation[] = [];
  for (const [n, e] of (result.entry ?? []).entries()) {
    if (e.resource?.resourceType === 'Observation') out.push(e.resource);
    else if (e.response?.location) {
      const [type, id] = e.response.location.split('/');
      if (type === 'Observation') out.push(await client.read<Observation>('Observation', id));
    } else {
      throw new Error(`The transaction response has no location for entry ${n + 1} (${sent.entry?.[n]?.fullUrl ?? 'no fullUrl'})`);
    }
  }
  return out;
}

interface SavedSoFar {
  response: QuestionnaireResponse;
  /** The vital signs posted so far, the latest of each. */
  vitals: Observation[];
  result: TriageResult;
  /** The preliminary NEWS2 recorded, if the guideline scored anything. */
  news2?: Observation;
  at: string;
}

const code = (o: Observation) => o.code.coding?.[0]?.code;

/** The same vital sign with the same value: posting it again would add nothing. */
function sameMeasurement(a: Observation, b: Observation | undefined): boolean {
  if (!b || code(a) !== code(b)) return false;
  const value = (o: Observation) =>
    JSON.stringify([
      o.valueQuantity?.value,
      o.valueQuantity?.code,
      o.valueCodeableConcept?.coding?.[0]?.code,
      o.component?.map((c) => [c.code.coding?.[0]?.code, c.valueQuantity?.value]),
    ]);
  return value(a) === value(b);
}

/** What the guideline said about the vitals saved so far: its provisional NEWS2 and priority. */
function PartialSaved({ partial }: { partial: SavedSoFar }) {
  const p = partial.result.provisional;
  const code = priorityOf(p.priority);
  return (
    <div className="partial-saved" role="status">
      <p>
        <strong>Vitals saved so far</strong> at {clock(partial.at)} ({partial.vitals.length} vital signs). The {partial.result.engine === 'server' ? 'guideline on the server' : 'guideline in this browser'}:
        NEWS2{' '}
        <strong className="num">{p.total === null ? '–' : `≥ ${p.total}`}</strong>
        {p.risk && <> · at least {RISK_TEXT[p.risk]} clinical risk</>}
        {code && (
          <>
            {' '}
            · priority so far at least <strong>{priority(code)!.name}</strong>
          </>
        )}
        .
      </p>
      {p.missing.length > 0 && <p>Still missing: {p.missing.map(sliceLabel).join(', ')}.</p>}
      <p className="quiet">
        {partial.news2 ? (
          <>
            Recorded as a preliminary NEWS2, <ResourceRef type="Observation" id={partial.news2.id} />.{' '}
          </>
        ) : null}
        Fill in the rest and save the triage for the final NEWS2 and the proposed priority.
      </p>
    </div>
  );
}
