import { useCallback, useEffect, useState } from 'react';
import type { Bundle, Composition, CompositionSection, Encounter, Observation, Patient, Practitioner } from 'fhir/r4';
import type { Route } from '../App';
import { ErrorNote } from '../components/ErrorNote';
import { clock, stamp } from '../components/format';
import { Narrative } from '../components/Narrative';
import { Samples } from '../components/Samples';
import { client } from '../services/cds';
import { absoluteBase, NURSE } from '../services/config';
import { entries } from '../services/fhirClient';
import { dischargeReport } from '../services/hdr';
import { derivedFrom, latestTriage, nowLocal, patientName } from '../services/patients';
import { priorityOf } from '../services/priority';
import { sampleDischargeSummary } from '../services/samples';

interface Props {
  patientId: string;
  encounterId?: string;
  go: (r: Route) => void;
}

// The report takes one NEWS2 and one triage (demo/lib/hdr.js): the latest triage of the visit
// and the NEWS2 it was based on, with the vital signs that NEWS2 was scored from. There is no
// Organization on the server, so hdr.js names a placeholder emergency department.
interface Basis {
  triage: Observation;
  news2: Observation;
  vitals: Observation[];
  triages: number;
}

const has = (o: Observation, code: string) => !!o.code.coding?.some((c) => c.code === code);

export function ReportScreen({ patientId, encounterId, go }: Props) {
  const [patient, setPatient] = useState<Patient>();
  const [encounter, setEncounter] = useState<Encounter>();
  const [report, setReport] = useState<Bundle>();
  const [error, setError] = useState<unknown>();
  const [what, setWhat] = useState('Loading the visit');
  const [busy, setBusy] = useState(false);
  const [basis, setBasis] = useState<Basis>();
  // The hospital course, free text for the report (hdr.js dischargeSummary); not stored on the server
  const [summary, setSummary] = useState('');
  const [built, setBuilt] = useState('');

  const build = useCallback(
    async (p: Patient, enc: Encounter, dischargeSummary: string) => {
      setBusy(true);
      setWhat('Building the discharge report');
      setError(undefined);
      try {
        const [author, latest] = await Promise.all([client.read<Practitioner>('Practitioner', NURSE.id), latestTriage(p.id!, enc.id)]);
        const { triage, count } = latest;
        if (!triage) throw new Error('This visit has no triage to report on. Record one first.');
        const news2 = (await derivedFrom(triage)).find((o) => has(o, '1104051000000101'));
        if (!news2) throw new Error(`Triage Observation/${triage.id} refers to no NEWS2 (derivedFrom), so there is nothing to report the scores from.`);
        const vitals = await derivedFrom(news2);
        setBasis({ triage, news2, vitals, triages: count });
        setReport(dischargeReport({ patient: p, encounter: enc, author, vitals, news2, triage, dischargeSummary, fhirBase: absoluteBase() }));
        setBuilt(dischargeSummary);
      } catch (e) {
        setError(e);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const p = await client.read<Patient>('Patient', patientId);
        let enc: Encounter | undefined;
        if (encounterId) enc = await client.read<Encounter>('Encounter', encounterId);
        else {
          const found = entries(await client.search<Encounter>('Encounter', { subject: `Patient/${patientId}` }));
          enc = found.sort((a, b) => (b.period?.start ?? '').localeCompare(a.period?.start ?? ''))[0];
        }
        if (!live) return;
        setPatient(p);
        setEncounter(enc);
        if (enc && enc.status !== 'in-progress') void build(p, enc, '');
      } catch (e) {
        if (live) setError(e);
      }
    })();
    return () => {
      live = false;
    };
  }, [patientId, encounterId, build]);

  async function closeStay() {
    if (!patient || !encounter) return;
    setBusy(true);
    setWhat('Closing the stay (Encounter update)');
    setError(undefined);
    try {
      const closed = await client.update<Encounter>({
        ...encounter,
        status: 'finished',
        period: { ...encounter.period, end: nowLocal() },
      });
      setEncounter(closed);
      await build(patient, closed, summary);
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }

  async function fillSummary() {
    try {
      const t = basis?.triage ?? (await latestTriage(patientId, encounter?.id)).triage;
      setSummary(sampleDischargeSummary(priorityOf(t?.valueCodeableConcept?.coding?.[0])));
    } catch (e) {
      setError(e);
    }
  }

  const summaryField = (
    <div className="summary-field">
      <label className="note">
        Hospital course (optional, goes into the report)
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={6} />
      </label>
      <Samples>
        <button type="button" onClick={fillSummary} disabled={busy} title="An invented Swedish hospital course, for the priority of the latest triage">
          Sample summary
        </button>
      </Samples>
    </div>
  );

  function download() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/fhir+json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hdr-${patientId}-${(encounter?.period?.end ?? nowLocal()).slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  const composition = report?.entry?.[0]?.resource as Composition | undefined;

  return (
    <div className="report">
      <header className="report-head">
        <h1>Hospital Discharge Report{patient ? `: ${patientName(patient)}` : ''}</h1>
        <p className="quiet">HL7 Europe HDR 1.0.0, a FHIR document Bundle for the EHDS.</p>
      </header>

      {encounter?.status === 'in-progress' && !report && (
        <div className="close-stay">
          <p>
            The visit that started {stamp(encounter.period?.start)} is still open. Closing it sets the end time to now ({clock(nowLocal())})
            and status to finished.
          </p>
          {summaryField}
          <div className="row">
            <button type="button" className="primary big" onClick={closeStay} disabled={busy}>
              {busy ? 'Closing…' : 'Close the stay and build the report'}
            </button>
            <button type="button" onClick={() => go({ screen: 'record', patientId })}>
              Back to the record
            </button>
          </div>
        </div>
      )}
      {!encounter && !error && patient && <p className="quiet">This patient has no visit to report on.</p>}
      {busy && !report && <p className="quiet">{what}…</p>}
      <ErrorNote error={error} what={what} />

      {report && composition && (
        <article className="document">
          <div className="doc-meta">
            <p>
              <strong>{composition.title}</strong> · {composition.type.coding?.[0]?.display ?? composition.type.text} ·{' '}
              {composition.status}
            </p>
            {basis && (
              <p className="quiet">
                Based on the latest triage of the visit ({clock(basis.triage.effectiveDateTime)}
                {basis.triages > 1 ? `, the last of ${basis.triages}` : ''}), its NEWS2 and the {basis.vitals.length} vital signs
                that NEWS2 was scored from. The report holds one triage.
              </p>
            )}
            <p>
              Written {stamp(composition.date)} · {report.entry?.length ?? 0} resources in the Bundle · visit{' '}
              {stamp(encounter?.period?.start)} – {clock(encounter?.period?.end)}
            </p>
            <div className="row">
              <button type="button" className="primary" onClick={download}>
                Download the Bundle (JSON)
              </button>
              <button type="button" onClick={() => go({ screen: 'record', patientId, encounterId: encounter?.id })}>
                Back to the record
              </button>
            </div>
            <details className="edit-summary">
              <summary>{built ? 'Change the hospital course' : 'Add a hospital course'}</summary>
              {summaryField}
              <button type="button" onClick={() => patient && encounter && void build(patient, encounter, summary)} disabled={busy || summary === built}>
                Rebuild the report
              </button>
            </details>
          </div>
          {(composition.section ?? []).map((s, i) => (
            <DocSection key={i} section={s} depth={0} />
          ))}
        </article>
      )}
      {report && !composition && (
        <ErrorNote error={new Error('The report Bundle does not start with a Composition')} what="Reading the report" />
      )}
    </div>
  );
}

function DocSection({ section, depth }: { section: CompositionSection; depth: number }) {
  const H = depth === 0 ? 'h2' : 'h3';
  return (
    <section className={`doc-section depth-${depth}`}>
      <H>{section.title ?? section.code?.coding?.[0]?.display ?? 'Section'}</H>
      {(section.text || !section.section?.length) && <Narrative xhtml={section.text?.div} />}
      {section.section?.map((sub, i) => <DocSection key={i} section={sub} depth={depth + 1} />)}
    </section>
  );
}
