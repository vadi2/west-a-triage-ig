import type { Encounter, Patient } from 'fhir/r4';
import type { Route, Screen, Stay } from '../App';
import { MOCK, NURSE } from '../services/config';
import { age, isTest, patientIdentifier, patientName } from '../services/patients';
import { priority, type PriorityCode } from '../services/priority';
import { clock } from './format';

interface Props {
  screen: Screen;
  patient?: Patient;
  encounter?: Encounter;
  recorded?: PriorityCode;
  stay?: Stay;
  go: (r: Route) => void;
}

const STEPS: { screen: Screen; label: string }[] = [
  { screen: 'patients', label: 'Patients' },
  { screen: 'form', label: 'Triage' },
  { screen: 'result', label: 'Priority' },
  { screen: 'record', label: 'Record' },
  { screen: 'report', label: 'Discharge' },
];

/**
 * The patient's wristband: who is being triaged, checked at every step. It is white plastic
 * until a priority is recorded, then it carries that colour.
 */
export function Wristband({ screen, patient, encounter, recorded, stay, go }: Props) {
  const p = priority(recorded);
  const id = patientIdentifier(patient);
  const years = age(patient);

  const reachable = (s: Screen) => {
    if (s === 'patients') return true;
    if (!stay) return false;
    if (s === 'form') return true;
    if (s === 'result') return !!stay.result;
    return true;
  };

  const target = (s: Screen): Route => ({ screen: s, patientId: stay?.patient.id, encounterId: stay?.encounter.id });

  return (
    <header className={`band ${p ? `state-${p.key}` : 'state-none'}`}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="band-who">
        {patient ? (
          <>
            <strong className="band-name">{patientName(patient)}</strong>
            {id && (
              <span>
                {id.label} <span className="num">{id.value}</span>
              </span>
            )}
            <span>
              {years !== undefined ? `${years} y` : 'age unknown'}, {patient.gender ?? 'gender unknown'}
            </span>
            {encounter?.period?.start && <span>arrived {clock(encounter.period.start)}</span>}
            {isTest(patient) && <span className="band-test">test data</span>}
            {p && <strong className="band-priority">{p.name}</strong>}
          </>
        ) : (
          <span>
            <strong>WEST-A triage</strong> · Akutmottagningen, VGR · nurse {NURSE.name}
          </span>
        )}
        {MOCK && <span className="band-mock">mock server</span>}
      </div>
      <nav aria-label="Steps" className="band-steps">
        {STEPS.map((s) =>
          s.screen === screen ? (
            <span key={s.screen} aria-current="step" className="step current">
              {s.label}
            </span>
          ) : reachable(s.screen) && (s.screen === 'patients' || stay) ? (
            <button key={s.screen} type="button" className="step" onClick={() => go(target(s.screen))}>
              {s.label}
            </button>
          ) : (
            <span key={s.screen} className="step off" aria-disabled="true">
              {s.label}
            </span>
          ),
        )}
      </nav>
    </header>
  );
}
