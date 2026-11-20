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
import { RendererTheme } from '../theme';
import { readAnswers, yellowAsLowest } from '../services/answers';
import { client, runTriage } from '../services/cds';
import { CRITERION_SYSTEM, criteriaReasons, loadCriteria, type Criteria } from '../services/criteria';
import { IG, MOCK, NURSE, QUESTIONNAIRE_ID, QUESTIONNAIRE_URL } from '../services/config';
import { extractVitals } from '../services/extract';
import { news2 } from '../services/news2';
import { nowLocal } from '../services/patients';
import { withAnswerOptions } from '../services/terminology';

type StepState = 'waiting' | 'running' | 'done' | 'failed';
const STEP_NAMES = [
  'Save the form (QuestionnaireResponse)',
  'Extract the vital signs (SDC template extraction)',
  'Save the vital sign Observations',
  'Run the WEST-A guideline (PlanDefinition/$apply, Library/$evaluate)',
] as const;

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
  // Bumped once a filled-in form has rendered, see fillExample
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        // The Questionnaire as published (with its extraction templates), and the same with
        // its value sets expanded for the renderer (see services/terminology.ts)
        const q = stay.questionnaire ?? (await client.read<Questionnaire>('Questionnaire', QUESTIONNAIRE_ID));
        const [formQ, crit] = await Promise.all([withAnswerOptions(q, client), loadCriteria(client)]);
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
  const reasons = useMemo(() => criteriaReasons(answers, criteria, yellowAsLowest(answers)), [answers, criteria]);

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

  async function submit() {
    if (!questionnaire || !formQuestionnaire) return;
    setError(undefined);
    const raw = getResponse();
    const draft = removeInternalIdsFromResponse(formQuestionnaire, removeEmptyAnswersFromResponse(formQuestionnaire, raw));
    const a = readAnswers(draft);
    const r = criteriaReasons(a, criteria, yellowAsLowest(a));
    const missing = [
      news2(a).total === null && 'all seven vital parameters',
      !a.chiefComplaint && 'the chief complaint',
      a.chiefComplaint && !r.assessed && 'its warning symptoms (tick them, or "No warning symptoms")',
    ].filter(Boolean);
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
      const qr: QuestionnaireResponse = {
        ...draft,
        questionnaire: `${QUESTIONNAIRE_URL}|${questionnaire.version ?? '0.1.0'}`,
        status: 'completed',
        subject: { reference: `Patient/${stay.patient.id}` },
        encounter: { reference: `Encounter/${stay.encounter.id}` },
        author: { reference: `Practitioner/${NURSE.id}` },
        authored: nowLocal(),
      };
      const saved = await client.create(qr);
      mark(i++, 'done');

      const bundle = await extractVitals(questionnaire, saved);
      if (bundle.type !== 'transaction' || !bundle.entry?.length) {
        throw new Error(`extractVitals gave a ${bundle.type} Bundle with ${bundle.entry?.length ?? 0} entries; expected a transaction with the vital signs`);
      }
      mark(i++, 'done');

      const result: Bundle = await client.transaction(bundle);
      const vitals = await savedObservations(bundle, result);
      mark(i++, 'done');

      const triage = await runTriage({
        patientId: stay.patient.id!,
        encounterId: stay.encounter.id!,
        practitionerId: NURSE.id,
        complaintPriority: a.complaintPriority ?? null,
        yellowAsLowest: yellowAsLowest(a),
        scale2: a.scale2,
        triageCriteria: a.triageCriteria,
      });
      mark(i++, 'done');

      onDone({ ...stay, questionnaire, response: saved, answers: a, vitals, result: triage, recorded: undefined });
    } catch (e) {
      mark(i, 'failed');
      setError(e);
    }
  }

  function fillExample() {
    if (!formQuestionnaire) return;
    // Right after buildForm the renderer has not yet worked out which items its enableWhen
    // shows, so removeEmptyAnswersFromResponse drops the triage criteria: read them again
    // once the form has rendered.
    void build(formQuestionnaire, exampleResponse()).then(() => setTimeout(() => setFilled((n) => n + 1), 300));
  }

  if (loadError) return <ErrorNote error={loadError} what={`Loading Questionnaire/${QUESTIONNAIRE_ID} and its terminology`} />;

  const seconds = startedAt ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0;

  return (
    <div className="form-screen">
      <section className="form-col" aria-labelledby="form-title">
        <div className="form-top">
          <h1 id="form-title">WEST-A triage form</h1>
          <button type="button" onClick={fillExample} disabled={!ready || !!steps}>
            Fill the guide’s example
          </button>
        </div>
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
        <div className="submit-row">
          <button type="button" className="primary big" onClick={submit} disabled={!ready || (!!steps && !error)}>
            Save and run the guideline
          </button>
        </div>
        {steps && (
          <ol className="steps" aria-live="polite">
            {STEP_NAMES.map((name, n) => (
              <li key={name} className={`step-${steps[n]}`}>
                <span className="step-mark" aria-hidden="true">
                  {steps[n] === 'done' ? '✓' : steps[n] === 'failed' ? '✕' : steps[n] === 'running' ? '…' : '·'}
                </span>
                {name}
                {steps[n] === 'running' && n === 3 && (
                  <span className="num step-time">
                    {' '}
                    {seconds} s{MOCK ? '' : ' (the server takes 5–15 s)'}
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
          sources={reasons.pins}
          caption={
            <>
              <strong>While you type</strong> · counted here in the browser. The guideline on the server gives the priority.
            </>
          }
        />
      </aside>
      <p className="phone-tally" aria-live="polite">
        NEWS2 so far: <strong className="num">{preview.total ?? '–'}</strong>
        {preview.risk ? ` · ${preview.risk}` : ''}
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

const SCT = 'http://snomed.info/sct';

/** The guide's example triage: NEWS2 5 (medium risk), chest pain with an orange warning symptom (15). */
function exampleResponse(): QuestionnaireResponse {
  return {
    resourceType: 'QuestionnaireResponse',
    status: 'in-progress',
    item: [
      {
        linkId: 'vitals',
        item: [
          { linkId: 'respiratory-rate', answer: [{ valueInteger: 22 }] },
          { linkId: 'oxygen-saturation', answer: [{ valueInteger: 95 }] },
          { linkId: 'oxygen-flow', answer: [{ valueDecimal: 0 }] },
          { linkId: 'systolic', answer: [{ valueInteger: 105 }] },
          { linkId: 'diastolic', answer: [{ valueInteger: 70 }] },
          { linkId: 'heart-rate', answer: [{ valueInteger: 95 }] },
          { linkId: 'consciousness', answer: [{ valueCoding: { system: SCT, version: 'http://snomed.info/sct/45991000052106', code: '248234008', display: 'Mentally alert' } }] },
          { linkId: 'temperature', answer: [{ valueDecimal: 37.5 }] },
        ],
      },
      {
        linkId: 'assessment',
        item: [
          { linkId: 'chief-complaint', answer: [{ valueCoding: { system: `${IG}/CodeSystem/west-a-chief-complaint-cs`, code: '4', display: 'Bröstsmärta' } }] },
          {
            linkId: 'triage-criteria',
            item: [
              {
                linkId: 'triage-criteria-4',
                answer: [
                  {
                    valueCoding: {
                      system: CRITERION_SYSTEM,
                      code: '15',
                      display: 'Ongoing chest pain with suspected acute coronary syndrome or another serious cause',
                    },
                  },
                ],
              },
            ],
          },
          { linkId: 'frail-elderly', answer: [{ valueBoolean: false }] },
          { linkId: 'likely-admission', answer: [{ valueBoolean: false }] },
          { linkId: 'violence-or-assault', answer: [{ valueBoolean: false }] },
          { linkId: 'oxygen-scale-2', answer: [{ valueBoolean: false }] },
        ],
      },
    ],
  };
}

