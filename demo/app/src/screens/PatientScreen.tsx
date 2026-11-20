import { useEffect, useState, type FormEvent } from 'react';
import type { Encounter, Observation, Patient } from 'fhir/r4';
import { ErrorNote } from '../components/ErrorNote';
import { Samples } from '../components/Samples';
import { stamp } from '../components/format';
import {
  age,
  createSyntheticPatient,
  findPatients,
  isTest,
  latestTriages,
  patientIdentifier,
  patientName,
  randomPatientDraft,
  reserveNumber,
  openEncounter,
  type PatientDraft,
} from '../services/patients';
import { priority } from '../services/priority';

interface Props {
  onStart: (patient: Patient, encounter: Encounter) => void;
  onRecord: (patient: Patient) => void;
}

export function PatientScreen({ onStart, onRecord }: Props) {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<Patient[] | undefined>();
  const [triages, setTriages] = useState<Map<string, Observation>>(new Map());
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState<string | undefined>();

  async function search(text: string) {
    setError(undefined);
    try {
      const found = await findPatients(text);
      setPatients(found);
      setTriages(await latestTriages(found));
    } catch (e) {
      setError(e);
      setPatients([]);
    }
  }

  useEffect(() => {
    void search('');
  }, []);

  async function start(p: Patient) {
    setBusy(p.id);
    setError(undefined);
    try {
      onStart(p, await openEncounter(p));
    } catch (e) {
      setError(e);
      setBusy(undefined);
    }
  }

  return (
    <div className="patients">
      <section className="patients-list" aria-labelledby="who">
        <h1 id="who">Who is at the triage desk?</h1>
        <form
          className="search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            void search(query);
          }}
        >
          <label htmlFor="q">Name, personnummer or reserve number</label>
          <div className="row">
            <input id="q" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
            <button type="submit">Search</button>
          </div>
        </form>
        <ErrorNote error={error} what="Talking to the FHIR server" />
        {patients === undefined ? (
          <p className="quiet">Loading patients…</p>
        ) : patients.length === 0 ? (
          <p className="quiet">No patient found{query ? ` for “${query}”` : ''}. Add a synthetic one.</p>
        ) : (
          <ol className="queue">
            {patients.map((p) => {
              const t = triages.get(p.id!);
              const pr = priority(t?.valueCodeableConcept?.coding?.[0]?.code);
              const id = patientIdentifier(p);
              const years = age(p);
              return (
                <li key={p.id} className="queue-row">
                  <span className={`swatch ${pr ? `state-${pr.key}` : 'state-none'}`} aria-hidden="true" />
                  <div className="queue-who">
                    <strong>{patientName(p) || 'Unknown patient'}</strong>
                    <span>
                      {id ? (
                        <>
                          {id.label} <span className="num">{id.value}</span>
                        </>
                      ) : (
                        'no identifier'
                      )}
                      {' · '}
                      {years !== undefined ? `${years} y` : 'age unknown'}, {p.gender ?? '–'}
                      {isTest(p) && <span className="tag">test data</span>}
                    </span>
                    <span className="queue-last">
                      {pr ? (
                        <>
                          Last triage <strong>{pr.name}</strong>, {stamp(t!.effectiveDateTime)}
                        </>
                      ) : (
                        'Not triaged'
                      )}
                    </span>
                  </div>
                  <div className="queue-actions">
                    <button type="button" className="primary" onClick={() => start(p)} disabled={!!busy}>
                      {busy === p.id ? 'Opening visit…' : 'Start triage'}
                    </button>
                    <button type="button" className="link" onClick={() => onRecord(p)}>
                      Record
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
      <NewPatient onCreated={(p) => void start(p)} />
    </div>
  );
}

const EMPTY: PatientDraft = { given: '', family: '', gender: 'unknown', birthDate: '' };

function NewPatient({ onCreated }: { onCreated: (p: Patient) => void }) {
  const [d, setD] = useState<PatientDraft>(EMPTY);
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const set = (k: keyof PatientDraft) => (e: { target: { value: string } }) => setD({ ...d, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      onCreated(await createSyntheticPatient(d));
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  const valid = d.given.trim() && d.family.trim() && /^\d{4}-\d{2}-\d{2}$/.test(d.birthDate);

  return (
    <section className="new-patient" aria-labelledby="new">
      <h2 id="new">New synthetic patient</h2>
      <Samples>
        <button type="button" onClick={() => setD(randomPatientDraft())} title="An invented Swedish name, birth date and gender">
          Sample patient
        </button>
      </Samples>
      <p className="quiet">
        Gets a VGR reserve number (LRID) such as <span className="num">{valid ? reserveNumber(d).slice(0, 9) + 'NNN' : '–'}</span>{' '}
        and a test-data tag. Never enter a real person.
      </p>
      <form onSubmit={submit} className="fields">
        <label>
          Given name
          <input value={d.given} onChange={set('given')} required />
        </label>
        <label>
          Family name
          <input value={d.family} onChange={set('family')} required />
        </label>
        <label>
          Birth date
          <input type="date" value={d.birthDate} onChange={set('birthDate')} required />
        </label>
        <fieldset>
          <legend>Gender</legend>
          {(['female', 'male', 'other'] as const).map((g) => (
            <label key={g} className="inline">
              <input type="radio" name="gender" value={g} checked={d.gender === g} onChange={() => setD({ ...d, gender: g })} />
              {g}
            </label>
          ))}
        </fieldset>
        <div className="row">
          <button type="submit" className="primary" disabled={!valid || busy}>
            {busy ? 'Saving…' : 'Save and start triage'}
          </button>
        </div>
        <ErrorNote error={error} what="Saving the patient" />
      </form>
    </section>
  );
}
