import { useCallback, useEffect, useState } from 'react';
import type { Encounter, Observation, Patient, Questionnaire, QuestionnaireResponse } from 'fhir/r4';
import type { TriageAnswers } from './services/answers';
import type { TriageResult } from './services/cds';
import type { PriorityCode } from './services/priority';
import { Wristband } from './components/Wristband';
import { PatientScreen } from './screens/PatientScreen';
import { TriageFormScreen } from './screens/TriageFormScreen';
import { ResultScreen } from './screens/ResultScreen';
import { RecordScreen } from './screens/RecordScreen';
import { ReportScreen } from './screens/ReportScreen';
import { prepareServer } from './services/backend';

export type Screen = 'patients' | 'form' | 'result' | 'record' | 'report';

export interface Route {
  screen: Screen;
  patientId?: string;
  encounterId?: string;
}

/** One triage in progress: what the form screen hands to the result screen. */
export interface Stay {
  patient: Patient;
  encounter: Encounter;
  questionnaire?: Questionnaire;
  response?: QuestionnaireResponse;
  answers?: TriageAnswers;
  vitals?: Observation[];
  result?: TriageResult;
  recorded?: { priority: PriorityCode; news2: Observation; triage: Observation };
}

function parseHash(): Route {
  const [path, query = ''] = window.location.hash.replace(/^#\/?/, '').split('?');
  const q = new URLSearchParams(query);
  const screen = (['patients', 'form', 'result', 'record', 'report'] as Screen[]).find((s) => s === path) ?? 'patients';
  return { screen, patientId: q.get('p') ?? undefined, encounterId: q.get('e') ?? undefined };
}

function toHash(r: Route): string {
  const q = new URLSearchParams();
  if (r.patientId) q.set('p', r.patientId);
  if (r.encounterId) q.set('e', r.encounterId);
  const s = q.toString();
  return `#/${r.screen}${s ? '?' + s : ''}`;
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [stay, setStay] = useState<Stay | undefined>();

  // The nurse the app refers to, on a server that lacks it (a fresh or purged sandbox). Writes
  // wait for this too, and report its failure.
  useEffect(() => {
    prepareServer().catch(() => {});
  }, []);

  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const go = useCallback((r: Route) => {
    const h = toHash(r);
    if (window.location.hash !== h) window.location.hash = h;
    else setRoute(r);
    window.scrollTo(0, 0);
  }, []);

  // The form and result screens work on the stay in memory; without one they start over.
  const stayFits =
    stay && (!route.encounterId || stay.encounter.id === route.encounterId) && (!route.patientId || stay.patient.id === route.patientId);
  let screen = route.screen;
  if ((screen === 'form' || screen === 'result') && !stayFits) screen = 'patients';
  if (screen === 'result' && !stay?.result) screen = 'patients';
  if ((screen === 'record' || screen === 'report') && !route.patientId) screen = 'patients';

  const bandPatient = screen === 'patients' ? undefined : stayFits ? stay?.patient : undefined;

  return (
    <div className="app">
      <Wristband
        screen={screen}
        patient={bandPatient}
        encounter={stayFits ? stay?.encounter : undefined}
        recorded={stayFits ? stay?.recorded?.priority : undefined}
        go={go}
        stay={stayFits ? stay : undefined}
      />
      <main id="main" tabIndex={-1}>
        {screen === 'patients' && (
          <PatientScreen
            onStart={(patient, encounter) => {
              setStay({ patient, encounter });
              go({ screen: 'form', patientId: patient.id, encounterId: encounter.id });
            }}
            onRecord={(patient) => go({ screen: 'record', patientId: patient.id })}
          />
        )}
        {screen === 'form' && stay && (
          <TriageFormScreen
            stay={stay}
            onDone={(next) => {
              setStay(next);
              go({ screen: 'result', patientId: next.patient.id, encounterId: next.encounter.id });
            }}
          />
        )}
        {screen === 'result' && stay?.result && (
          <ResultScreen
            stay={stay}
            onRecorded={(next) => setStay(next)}
            go={go}
          />
        )}
        {screen === 'record' && route.patientId && (
          <RecordScreen
            patientId={route.patientId}
            highlightEncounter={route.encounterId}
            go={go}
            onRetriage={(patient, encounter) => {
              setStay({ patient, encounter });
              go({ screen: 'form', patientId: patient.id, encounterId: encounter.id });
            }}
          />
        )}
        {screen === 'report' && route.patientId && (
          <ReportScreen patientId={route.patientId} encounterId={route.encounterId} go={go} />
        )}
      </main>
    </div>
  );
}
