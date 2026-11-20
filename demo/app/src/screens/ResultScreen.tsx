import { useMemo, useState } from 'react';
import type { Bundle, Observation } from 'fhir/r4';
import type { Route, Stay } from '../App';
import { ErrorNote } from '../components/ErrorNote';
import { clock } from '../components/format';
import { Pinboard, type SourcePin } from '../components/Pinboard';
import { yellowAsLowest } from '../services/answers';
import { client, news2Observation, triageObservation } from '../services/cds';
import { NURSE } from '../services/config';
import { uuid } from '../services/libs';
import { nowLocal } from '../services/patients';
import { allowed, priority, priorityCoding, priorityOf, RISK_PRIORITY, RISK_TEXT, type PriorityCode } from '../services/priority';

interface Props {
  stay: Stay;
  onRecorded: (s: Stay) => void;
  go: (r: Route) => void;
}

export function ResultScreen({ stay, onRecorded, go }: Props) {
  const result = stay.result!;
  const answers = stay.answers!;
  const proposed = priorityOf(result.proposedPriority);
  const floor = yellowAsLowest(answers);
  const closed = useMemo(() => allowed(proposed, floor), [proposed, floor]);
  const [selected, setSelected] = useState<PriorityCode | undefined>(stay.recorded?.priority ?? proposed);
  const [note, setNote] = useState('');
  const [error, setError] = useState<unknown>();
  const [saving, setSaving] = useState(false);
  const recorded = stay.recorded;

  const complaintPriority = priorityOf(answers.complaintPriority);
  const sources: SourcePin[] = [
    ...(complaintPriority ? [{ priority: complaintPriority, label: 'warning symptom' }] : []),
    ...(floor ? [{ priority: '3' as const, label: 'lowest for need' }] : []),
  ];
  const needs = [
    answers.frailElderly && 'frail elderly (p. 46)',
    answers.likelyAdmission && 'likely admission (p. 47)',
    answers.violenceOrAssault && 'violence or sexual assault (p. 48)',
  ].filter(Boolean);
  const complaint = answers.chiefComplaint?.display ?? answers.chiefComplaint?.code ?? '–';
  const lowered = !!(proposed && selected && selected > proposed);
  const closedNames = Object.entries(closed).filter(([, why]) => why);

  async function save() {
    if (!selected || !answers.chiefComplaint) return;
    setSaving(true);
    setError(undefined);
    try {
      const at = nowLocal();
      const who = { patientId: stay.patient.id!, encounterId: stay.encounter.id!, practitionerId: NURSE.id, effectiveDateTime: at };
      const news2 = await news2Observation({
        ...who,
        news2: result.news2,
        scale2: answers.scale2,
        vitals: (stay.vitals ?? []).map((o) => ({ reference: `Observation/${o.id}` })),
      });
      const news2Url = uuid();
      const notes = [
        selected !== proposed && proposed
          ? `Clinical assessment: ${priority(selected)!.name}, proposed ${priority(proposed)!.name}.`
          : '',
        note.trim(),
      ].filter(Boolean);
      const triage = await triageObservation({
        ...who,
        priority: priorityCoding(selected),
        chiefComplaint: answers.chiefComplaint,
        news2: { reference: news2Url },
        note: notes.join(' ') || undefined,
      });
      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          { fullUrl: news2Url, resource: news2, request: { method: 'POST', url: 'Observation' } },
          { fullUrl: uuid(), resource: triage, request: { method: 'POST', url: 'Observation' } },
        ],
      };
      const res = await client.transaction(bundle);
      const [n2, tr] = await Promise.all(
        (res.entry ?? []).map(async (e) =>
          e.resource?.resourceType === 'Observation'
            ? (e.resource as Observation)
            : client.read<Observation>('Observation', e.response!.location!.split('/')[1]),
        ),
      );
      onRecorded({ ...stay, recorded: { priority: selected, news2: n2, triage: tr } });
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  const n = result.news2;
  const pv = priority(proposed);

  return (
    <div className="result">
      <section className="result-verdict" aria-labelledby="why">
        <h1 id="why" className={pv ? `verdict state-${pv.key}` : 'verdict state-none'}>
          {pv ? (
            <>
              Proposed <strong>{pv.name}</strong>
            </>
          ) : (
            'No proposed priority'
          )}
        </h1>
        <p className="quiet">The most urgent of these, by the guideline on the server:</p>
        <ul className="reasons">
          <li>
            NEWS2 <strong className="num">{n.total ?? '–'}</strong>
            {n.risk && (
              <>
                , {RISK_TEXT[n.risk]} clinical risk → <strong>{priority(RISK_PRIORITY[n.risk])!.name}</strong> (p. 6)
              </>
            )}
          </li>
          <li>
            {complaint}: warning symptom{' '}
            <strong>{complaintPriority ? priority(complaintPriority)!.name : 'not assessed'}</strong>
          </li>
          {needs.length > 0 && (
            <li>
              {needs.join(', ')}: <strong>Gul</strong> at least
            </li>
          )}
        </ul>
        {result.summaries.length > 0 && (
          <div className="summaries">
            <p className="quiet">The guideline said</p>
            <ul>
              {result.summaries.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <section className="result-decide" aria-label="Record the priority">
        {recorded ? (
          <div className="recorded" role="status">
            <p>
              Recorded <strong>{priority(recorded.priority)!.name}</strong> at {clock(recorded.triage.effectiveDateTime)}: NEWS2{' '}
              <span className="num">Observation/{recorded.news2.id}</span>, triage <span className="num">Observation/{recorded.triage.id}</span>.
            </p>
            <div className="row">
              <button type="button" className="primary" onClick={() => go({ screen: 'record', patientId: stay.patient.id, encounterId: stay.encounter.id })}>
                Open the record
              </button>
              <button type="button" onClick={() => go({ screen: 'patients' })}>
                Next patient
              </button>
            </div>
          </div>
        ) : (
          <div className="decide">
            <p>
              Your clinical assessment can raise the priority. Pick it on the board, then record it.
            </p>
            {closedNames.length > 0 && (
              <p id="closed-reason" className="closed-reason">
                {closedNames.map(([c]) => priority(c)!.name).join(' and ')} closed: {closedNames[0][1]}.
              </p>
            )}
            <label className="note">
              Note {lowered ? '(needed when the priority is lowered)' : '(optional)'}
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} required={lowered} />
            </label>
            <button
              type="button"
              className={`primary big record-btn ${selected ? `state-${priority(selected)!.key}` : ''}`}
              onClick={save}
              disabled={!selected || saving || (lowered && !note.trim())}
            >
              {saving ? 'Recording…' : selected ? `Record ${priority(selected)!.name}` : 'Pick a priority'}
            </button>
            <ErrorNote error={error} what="Recording NEWS2 and the triage" />
          </div>
        )}
      </section>
      <section className="result-board" aria-label="NEWS2 per parameter and priority">
        <Pinboard
          answers={answers}
          news2={n}
          sources={sources}
          caption={
            <>
              <strong>NEWS2 per parameter</strong> · from the guideline on the server, at {clock(stay.response?.authored)}
            </>
          }
          choice={
            recorded
              ? { proposed, selected: recorded.priority, closed: allowed(undefined, false), onSelect: () => {}, locked: true }
              : { proposed, selected, closed, onSelect: setSelected }
          }
        />
      </section>
    </div>
  );
}
