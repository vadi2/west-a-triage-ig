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
import { absoluteBase, MOCK, NURSE, QUESTIONNAIRE_ID, QUESTIONNAIRE_URL } from '../services/config';
import { extractVitals } from '../services/extract';
import { news2 } from '../services/news2';
import { nowLocal } from '../services/patients';
import { PRIORITY_SYSTEM } from '../services/priority';

type StepState = 'waiting' | 'running' | 'done' | 'failed';
const STEP_NAMES = [
  'Save the form (QuestionnaireResponse)',
  'Extract the vital signs (SDC template extraction)',
  'Save the vital sign Observations',
  'Run the WEST-A guideline (PlanDefinition/$apply)',
] as const;

export function TriageFormScreen({ stay, onDone }: { stay: Stay; onDone: (s: Stay) => void }) {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | undefined>(stay.questionnaire);
  const [loadError, setLoadError] = useState<unknown>();
  const [ready, setReady] = useState(false);
  const [steps, setSteps] = useState<StepState[] | undefined>();
  const [error, setError] = useState<unknown>();
  const [incomplete, setIncomplete] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const q = stay.questionnaire ?? (await client.read<Questionnaire>('Questionnaire', QUESTIONNAIRE_ID));
        if (!live) return;
        setQuestionnaire(q);
        await build(q);
        if (live) setReady(true);
      } catch (e) {
        if (live) setLoadError(e);
      }
    })();
    return () => {
      live = false;
    };
  }, [stay.questionnaire]);

  const response = useQuestionnaireResponseStore.use.updatableResponse();
  const answers = useMemo(() => readAnswers(response), [response]);
  const preview = useMemo(() => news2(answers), [answers]);

  async function build(q: Questionnaire, qr?: QuestionnaireResponse) {
    await buildForm({
      questionnaire: q,
      questionnaireResponse: qr,
      terminologyServerUrl: MOCK ? undefined : absoluteBase(),
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
    if (!questionnaire) return;
    setError(undefined);
    const raw = getResponse();
    const draft = removeInternalIdsFromResponse(questionnaire, removeEmptyAnswersFromResponse(questionnaire, raw));
    const a = readAnswers(draft);
    const missing = news2(a).total === null || !a.chiefComplaint || !a.complaintPriority;
    if (missing) {
      setIncomplete(true);
      useQuestionnaireResponseStore.getState().highlightRequiredItems();
      return;
    }
    setIncomplete(false);

    const state: StepState[] = ['running', 'waiting', 'waiting', 'waiting'];
    const mark = (i: number, s: StepState) => {
      state[i] = s;
      if (s === 'done' && i + 1 < state.length) state[i + 1] = 'running';
      setSteps([...state]);
    };
    setSteps([...state]);
    let i = 0;
    try {
      const qr: QuestionnaireResponse = {
        ...draft,
        questionnaire: `${QUESTIONNAIRE_URL}|${questionnaire.version ?? '0.1.0'}`,
        status: 'completed',
        subject: { reference: `Patient/${stay.patient.id}` },
        encounter: { reference: `Encounter/${stay.encounter.id}` },
        author: { reference: `Practitioner/${NURSE.id}`, display: NURSE.name },
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
        complaintPriority: a.complaintPriority ?? null,
        yellowAsLowest: yellowAsLowest(a),
        scale2: a.scale2,
      });
      mark(i++, 'done');

      onDone({ ...stay, questionnaire, response: saved, answers: a, vitals, result: triage, recorded: undefined });
    } catch (e) {
      mark(i, 'failed');
      setError(e);
    }
  }

  function fillExample() {
    if (questionnaire) void build(questionnaire, exampleResponse());
  }

  if (loadError) return <ErrorNote error={loadError} what={`Loading Questionnaire/${QUESTIONNAIRE_ID}`} />;

  const sources = [
    ...(answers.complaintPriority?.system === PRIORITY_SYSTEM && answers.complaintPriority.code
      ? [{ priority: answers.complaintPriority.code as '1', label: 'warning symptom' }]
      : []),
    ...(yellowAsLowest(answers) ? [{ priority: '3' as const, label: 'lowest for need' }] : []),
  ];

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
            All seven vital parameters, the chief complaint and the warning symptom priority are needed before the guideline can propose a priority.
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
          sources={sources}
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
const IG = 'https://vadi2.github.io/west-a-triage-ig';

/** The guide's example triage: NEWS2 5, medium risk, chest pain with an orange warning symptom. */
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
          { linkId: 'consciousness', answer: [{ valueCoding: { system: SCT, code: '248234008', display: 'A · Mentally alert' } }] },
          { linkId: 'temperature', answer: [{ valueDecimal: 37.5 }] },
        ],
      },
      {
        linkId: 'assessment',
        item: [
          { linkId: 'chief-complaint', answer: [{ valueCoding: { system: `${IG}/CodeSystem/west-a-chief-complaint-cs`, code: '4', display: 'Bröstsmärta' } }] },
          { linkId: 'complaint-priority', answer: [{ valueCoding: { system: PRIORITY_SYSTEM, code: '2', display: 'Orange' } }] },
          { linkId: 'frail-elderly', answer: [{ valueBoolean: false }] },
          { linkId: 'likely-admission', answer: [{ valueBoolean: false }] },
          { linkId: 'violence-or-assault', answer: [{ valueBoolean: false }] },
          { linkId: 'oxygen-scale-2', answer: [{ valueBoolean: false }] },
        ],
      },
    ],
  };
}
