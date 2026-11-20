import { useEffect, useState } from 'react';
import type { Encounter, Observation, Patient } from 'fhir/r4';
import type { Route } from '../App';
import { ErrorNote } from '../components/ErrorNote';
import { CRITERION_SYSTEM } from '../services/criteria';
import { clock, stamp } from '../components/format';
import { client } from '../services/cds';
import { entries } from '../services/fhirClient';
import { acvpuLetter, PARAMETERS } from '../services/news2';
import { patientName } from '../services/patients';
import { priority } from '../services/priority';
import { NURSE } from '../services/config';

interface Props {
  patientId: string;
  highlightEncounter?: string;
  go: (r: Route) => void;
  onRetriage: (p: Patient, e: Encounter) => void;
}

interface Data {
  patient: Patient;
  encounters: Encounter[];
  observations: Observation[];
}

const TRIAGE = '425705009';
const NEWS2 = '1104051000000101';
const has = (o: Observation, code: string) => !!o.code.coding?.some((c) => c.code === code);
const idOf = (ref?: string) => ref?.split('/').pop();

// Which NEWS2 component scores which vital sign, to show the points next to each source
const COMPONENT_OF: Record<string, string> = {
  '9279-1': '1104301000000104',
  '2708-6': '1104311000000102',
  '427081008': '1104331000000105',
  '85354-9': '1104341000000101',
  '8867-4': '1104351000000103',
  '1104441000000107': '1104361000000100',
  '8310-5': '1104371000000107',
};

// The NEWS2 component of each parameter in chart order; SpO₂ by either scale
const PARAMETER_COMPONENTS: [string, string[]][] = [
  ['1104301000000104'],
  ['1104311000000102', '1104321000000108'],
  ['1104331000000105'],
  ['1104341000000101'],
  ['1104351000000103'],
  ['1104361000000100'],
  ['1104371000000107'],
].map((codes, i) => [PARAMETERS[i].label, codes]);

const isPreliminary = (o: Observation) => o.status === 'preliminary';

/** The parameters a preliminary NEWS2 has no score for. */
function missingOf(n2: Observation): string[] {
  const have = new Set((n2.component ?? []).flatMap((c) => c.code.coding?.map((x) => x.code) ?? []));
  return PARAMETER_COMPONENTS.filter(([, codes]) => !codes.some((c) => have.has(c))).map(([label]) => label);
}

const performer = (o: Observation) => {
  const p = o.performer?.[0];
  return p?.display ?? (p?.reference === `Practitioner/${NURSE.id}` ? NURSE.name : (p?.reference ?? 'no performer'));
};

function vitalName(o: Observation): string {
  const c = o.code.coding?.[0]?.code ?? '';
  return (
    {
      '9279-1': 'Respiration rate',
      '2708-6': 'SpO₂',
      '427081008': 'Oxygen flow',
      '85354-9': 'Blood pressure',
      '8867-4': 'Pulse',
      '1104441000000107': 'Consciousness',
      '8310-5': 'Temperature',
    }[c] ??
    o.code.coding?.[0]?.display ??
    c
  );
}

function vitalValue(o: Observation): string {
  if (o.valueQuantity) {
    const q = o.valueQuantity;
    if (q.code === 'L/min' && q.value === 0) return 'room air';
    return `${q.value} ${q.unit ?? q.code ?? ''}`.trim();
  }
  if (o.component?.length) return `${o.component.map((c) => c.valueQuantity?.value ?? '–').join('/')} mmHg`;
  if (o.valueCodeableConcept) return acvpuLetter(o.valueCodeableConcept.coding?.[0]?.code);
  return '–';
}

function points(news2: Observation, vital: Observation): number | undefined {
  const comp = COMPONENT_OF[vital.code.coding?.[0]?.code ?? ''];
  // SpO2 may be scored on scale 2 (another component code)
  const c = news2.component?.find(
    (k) => k.code.coding?.some((x) => x.code === comp || (comp === '1104311000000102' && x.code === '1104321000000108')),
  );
  return c?.valueInteger;
}

export function RecordScreen({ patientId, highlightEncounter, go, onRetriage }: Props) {
  const [data, setData] = useState<Data | undefined>();
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [patient, enc, obs] = await Promise.all([
          client.read<Patient>('Patient', patientId),
          client.search<Encounter>('Encounter', { subject: `Patient/${patientId}`, _count: '50' }),
          client.search<Observation>('Observation', { subject: `Patient/${patientId}`, _sort: '-date', _count: '500' }),
        ]);
        const encounters = entries(enc).sort((a, b) => (b.period?.start ?? '').localeCompare(a.period?.start ?? ''));
        if (live) setData({ patient, encounters, observations: entries(obs) });
      } catch (e) {
        if (live) setError(e);
      }
    })();
    return () => {
      live = false;
    };
  }, [patientId]);

  if (error) return <ErrorNote error={error} what="Loading the patient record" />;
  if (!data) return <p className="quiet pad">Loading the record…</p>;

  const byId = new Map(data.observations.map((o) => [o.id!, o]));
  const news2s = data.observations.filter((o) => has(o, NEWS2)).reverse();
  const triageOf = (n2: Observation) =>
    data.observations.find((o) => has(o, TRIAGE) && o.derivedFrom?.some((r) => idOf(r.reference) === n2.id));

  return (
    <div className="record">
      <header className="record-head">
        <h1>{patientName(data.patient)}: triage record</h1>
        <p className="quiet">Each NEWS2 hangs from the vital signs it was calculated from (Observation.derivedFrom).</p>
      </header>
      {news2s.length > 0 && <News2Strip news2s={news2s} triageOf={triageOf} />}
      {data.encounters.length === 0 && <p className="quiet">No visits yet.</p>}
      {data.encounters.map((enc) => {
        const obs = data.observations.filter((o) => idOf(o.encounter?.reference) === enc.id);
        const triages = obs.filter((o) => has(o, TRIAGE));
        // Triages and the preliminary NEWS2s recorded while vitals were missing, latest first
        const events = obs.filter((o) => has(o, TRIAGE) || (has(o, NEWS2) && isPreliminary(o)));
        const used = new Set<string>();
        events
          .filter((o) => !has(o, TRIAGE))
          .forEach((n2) => {
            used.add(n2.id!);
            n2.derivedFrom?.forEach((v) => used.add(idOf(v.reference)!));
          });
        triages.forEach((t) =>
          t.derivedFrom?.forEach((r) => {
            const n2 = byId.get(idOf(r.reference)!);
            n2?.derivedFrom?.forEach((v) => used.add(idOf(v.reference)!));
            if (n2) used.add(n2.id!);
          }),
        );
        const loose = obs.filter((o) => !has(o, TRIAGE) && !used.has(o.id!));
        return (
          <section key={enc.id} className={`visit ${enc.id === highlightEncounter ? 'is-current' : ''}`} aria-label={`Visit ${stamp(enc.period?.start)}`}>
            <div className="visit-head">
              <h2>
                Visit {stamp(enc.period?.start)}
                {enc.period?.end ? ` – ${clock(enc.period.end)}` : ''} · {enc.status}
              </h2>
              <div className="row">
                {enc.status === 'in-progress' && (
                  <button type="button" onClick={() => onRetriage(data.patient, enc)}>
                    Triage again
                  </button>
                )}
                <button type="button" className="primary" onClick={() => go({ screen: 'report', patientId, encounterId: enc.id })}>
                  {enc.status === 'in-progress' ? 'Close the stay and report' : 'Discharge report'}
                </button>
              </div>
            </div>
            {events.length === 0 && loose.length === 0 && <p className="quiet">Nothing recorded in this visit.</p>}
            {events.map((t) => {
              if (!has(t, TRIAGE)) {
                return (
                  <article key={t.id} className="event is-preliminary">
                    <div className="event-priority state-none">
                      <strong>Preliminary</strong>
                      <span>{clock(t.effectiveDateTime)}</span>
                    </div>
                    <div className="event-body">
                      <p>
                        <strong>Vitals so far</strong> · saved before all seven were measured · {performer(t)}
                      </p>
                      <p className="event-criteria">Missing: {missingOf(t).join(', ') || 'none'}</p>
                      <Provenance n2={t} byId={byId} />
                    </div>
                  </article>
                );
              }
              const p = priority(t.valueCodeableConcept?.coding?.[0]?.code);
              const n2 = t.derivedFrom?.map((r) => byId.get(idOf(r.reference)!)).find((o) => o && has(o, NEWS2));
              return (
                <article key={t.id} className="event">
                  <div className={`event-priority ${p ? `state-${p.key}` : 'state-none'}`}>
                    <strong>{p?.name ?? '?'}</strong>
                    <span>{clock(t.effectiveDateTime)}</span>
                  </div>
                  <div className="event-body">
                    <p>
                      <strong>Triage</strong> · {t.component?.[0]?.valueCodeableConcept?.coding?.[0]?.display ?? 'no chief complaint'} ·{' '}
                      {performer(t)} · <span className="num">Observation/{t.id}</span>
                    </p>
                    {criteriaOf(t).length > 0 && (
                      <p className="event-criteria">
                        Criteria: {criteriaOf(t).join(' · ')}
                      </p>
                    )}
                    {t.note?.map((nt, i) => (
                      <p key={i} className="event-note">
                        {nt.text}
                      </p>
                    ))}
                    {n2 ? (
                      <Provenance n2={n2} byId={byId} />
                    ) : (
                      <p className="quiet">No NEWS2 linked to this triage.</p>
                    )}
                  </div>
                </article>
              );
            })}
            {loose.length > 0 && (
              <div className="loose">
                <p className="quiet">Recorded in this visit, not part of a triage:</p>
                <ul>
                  {loose.map((o) => (
                    <li key={o.id}>
                      {has(o, NEWS2) ? 'NEWS2' : vitalName(o)} <span className="num">{has(o, NEWS2) ? o.valueInteger : vitalValue(o)}</span>{' '}
                      <span className="num prov-ref">
                        {clock(o.effectiveDateTime)} · Observation/{o.id}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** A NEWS2 hanging from the vital signs it was scored from; a preliminary one is hollow and says "≥". */
function Provenance({ n2, byId }: { n2: Observation; byId: Map<string, Observation> }) {
  const pre = isPreliminary(n2);
  return (
    <div className="prov">
      <p className="prov-news2">
        <span className={`pin ${pre ? 'pin-hollow' : ''}`} aria-hidden="true" />
        {pre ? 'Preliminary NEWS2 ' : 'NEWS2 '}
        <strong className="num">
          {pre ? '≥ ' : ''}
          {n2.valueInteger ?? '–'}
        </strong>{' '}
        at {clock(n2.effectiveDateTime)} ·{' '}
        <span className="num">Observation/{n2.id}</span> · from
      </p>
      <ul className="prov-vitals">
        {(n2.derivedFrom ?? []).map((r) => {
          const v = byId.get(idOf(r.reference)!);
          return (
            <li key={r.reference}>
              <span className="pin" aria-hidden="true" />
              {v ? (
                <>
                  <span className="prov-name">{vitalName(v)}</span>
                  <span className="num">{vitalValue(v)}</span>
                  <span className="num prov-pts">{points(n2, v) !== undefined ? `${points(n2, v)} p` : ''}</span>
                  <span className="num prov-ref">
                    {clock(v.effectiveDateTime)} · Observation/{v.id}
                  </span>
                </>
              ) : (
                <span className="num">{r.reference} (not found on the server)</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The triage criteria (warning symptoms and needs) recorded as components of a triage. */
function criteriaOf(t: Observation): string[] {
  return (t.component ?? [])
    .map((c) => c.valueCodeableConcept?.coding?.[0])
    .filter((c) => c?.system === CRITERION_SYSTEM)
    .map((c) => `${c!.code} ${c!.display ?? ''}`.trim());
}

/** NEWS2 over time: one pin per score, the thread between them, bands at 5 and 7; a preliminary NEWS2 is a hollow pin, "≥". */
function News2Strip({ news2s, triageOf }: { news2s: Observation[]; triageOf: (o: Observation) => Observation | undefined }) {
  // On a phone the strip is drawn narrower, so its labels stay readable instead of shrinking with it
  const narrow = useNarrow();
  const w = narrow ? 360 : 640;
  const h = 190;
  const pad = narrow ? { l: 74, r: 36, t: 22, b: 44 } : { l: 74, r: 56, t: 22, b: 44 };
  const max = Math.max(12, ...news2s.map((o) => o.valueInteger ?? 0));
  const x = (i: number) => pad.l + (news2s.length === 1 ? (w - pad.l - pad.r) / 2 : (i * (w - pad.l - pad.r)) / (news2s.length - 1));
  const y = (v: number) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
  const pts = news2s.map((o, i) => ({ x: x(i), y: y(o.valueInteger ?? 0), o }));
  const d = pts
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `Q ${(p.x + pts[i - 1].x) / 2} ${(p.y + pts[i - 1].y) / 2 + 8} ${p.x} ${p.y}`))
    .join(' ');
  return (
    <figure className="strip">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`NEWS2 over time: ${news2s.map((o) => `${isPreliminary(o) ? 'at least ' : ''}${o.valueInteger} at ${stamp(o.effectiveDateTime)}`).join(', ')}`}>
        {[5, 7].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} className="strip-band" />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" className="strip-label">
              {v === 5 ? '5 medium' : '7 high'}
            </text>
          </g>
        ))}
        <line x1={pad.l} x2={w - pad.r} y1={y(0)} y2={y(0)} className="strip-axis" />
        <text x={pad.l - 8} y={y(0) + 4} textAnchor="end" className="strip-label">
          0
        </text>
        <path d={d} className="thread-line" />
        {pts.map(({ x: px, y: py, o }, i) => {
          const t = triageOf(o);
          const p = priority(t?.valueCodeableConcept?.coding?.[0]?.code);
          return (
            <g key={o.id}>
              <circle cx={px + 1.5} cy={py + 2.5} r={6} className="strip-shadow" />
              <circle cx={px} cy={py} r={6} className={isPreliminary(o) ? 'strip-pin is-preliminary' : 'strip-pin'} />
              <text x={px + 10} y={py - 9} className="strip-value">
                {isPreliminary(o) ? `≥${o.valueInteger}` : o.valueInteger}
              </text>
              {p && <rect x={px - 9} y={h - pad.b + 8} width={18} height={10} className={`strip-swatch fill-${p.key}`} />}
              <text {...edgeLabel(px, i, pts.length)} y={h - 6} className="strip-label">
                {narrow && news2s.length > 2 ? clock(o.effectiveDateTime) : stamp(o.effectiveDateTime).replace(/ \d{4}/, '')}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="quiet">NEWS2 at each triage; the square under each is the priority recorded. A hollow pin is a preliminary NEWS2, a lower bound.</figcaption>
    </figure>
  );
}

function useNarrow() {
  const query = '(max-width: 600px)';
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setNarrow(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return narrow;
}

/** The first and last date labels lean inwards, so they are not cut at the edges. */
function edgeLabel(x: number, i: number, n: number) {
  if (n > 1 && i === 0) return { x: x - 9, textAnchor: 'start' as const };
  if (n > 1 && i === n - 1) return { x: x + 9, textAnchor: 'end' as const };
  return { x, textAnchor: 'middle' as const };
}
