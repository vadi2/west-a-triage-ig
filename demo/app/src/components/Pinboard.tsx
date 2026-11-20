import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { TriageAnswers } from '../services/answers';
import { displayValue, PARAMETERS, type News2 } from '../services/news2';
import { PRIORITIES, RISK_PRIORITY, RISK_TEXT, type PriorityCode } from '../services/priority';

export interface Choice {
  proposed?: PriorityCode;
  selected?: PriorityCode;
  closed: Record<PriorityCode, string | null>;
  onSelect: (p: PriorityCode) => void;
  /** Recorded: shown, no longer pressable. */
  locked?: boolean;
}

export interface SourcePin {
  priority: PriorityCode;
  label: string;
}

interface Props {
  answers: TriageAnswers;
  news2: News2;
  /** Pins in the priority row other than NEWS2: the warning symptom and the needs. */
  sources?: SourcePin[];
  /** Without a choice the board is a preview: the thread is dashed and nothing is pressable. */
  choice?: Choice;
  caption: ReactNode;
  /**
   * The preview's priority so far, the most urgent of what is known. `final` once NEWS2 is
   * complete and the warning symptoms are assessed; until then it is a lower bound ("at least").
   */
  lead?: { code: PriorityCode; final: boolean };
}

// Score columns 3, 2, 1, 0 sit over Röd, Orange, Gul, Grön: the patient's thread falls from
// the vital parameters, through the points each one scores, into the colour NEWS2 gives.
const SCORE_COLUMNS = [3, 2, 1, 0];

export function Pinboard({ answers, news2, sources = [], choice, caption, lead }: Props) {
  const board = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState<{ d: string; w: number; h: number }>({ d: '', w: 0, h: 0 });
  // While parameters are missing, NEWS2 so far is a lower bound: its pin is hollow, its label "≥"
  const partial = news2.total === null && news2.provisional.total !== null;
  const risk = news2.risk ?? news2.provisional.risk;
  const riskPriority = risk ? RISK_PRIORITY[risk] : undefined;
  const missing = news2.provisional.missing.length;

  useLayoutEffect(() => {
    const el = board.current;
    if (!el) return;
    const draw = () => {
      const box = el.getBoundingClientRect();
      const pts = [...el.querySelectorAll<HTMLElement>('[data-thread]')]
        .sort((a, b) => Number(a.dataset.thread) - Number(b.dataset.thread))
        .map((p) => {
          const r = p.getBoundingClientRect();
          return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
        });
      let d = '';
      pts.forEach((p, i) => {
        if (i === 0) {
          d = `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
          return;
        }
        const q = pts[i - 1];
        // A thread wound between two pins hangs a little below the straight line between them
        const sag = 5 + Math.abs(p.x - q.x) * 0.08;
        const lean = (i % 2 ? 1 : -1) * Math.min(6, Math.abs(p.y - q.y) * 0.05);
        d += ` Q ${((p.x + q.x) / 2 + lean).toFixed(1)} ${((p.y + q.y) / 2 + sag).toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      });
      setPath({ d, w: box.width, h: box.height });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
  }, [news2, answers, choice?.selected, sources.length]);

  let thread = 0;

  return (
    <div className={`board ${choice ? 'is-result' : 'is-preview'}`} ref={board}>
      <div className="board-caption">{caption}</div>
      <div className="board-head" aria-hidden="true">
        <span className="board-param">NEWS2 points</span>
        {SCORE_COLUMNS.map((s) => (
          <span key={s} className="board-col num">
            {s}
          </span>
        ))}
      </div>
      <ul className="board-rows">
        {PARAMETERS.map((param) => {
          const score = news2.scores[param.key];
          const measured = typeof score === 'number';
          return (
            <li key={param.key} className={`board-row ${measured ? '' : 'is-missing'}`}>
              <span className="board-param">
                <span className="param-label">{param.label}</span>
                <span className="param-value num">
                  <ValueText text={displayValue(param.key, answers)} />
                  {param.unit && displayValue(param.key, answers) !== '–' ? ` ${param.unit}` : ''}
                </span>
                <span className="param-score num" aria-label={measured ? `${score} points` : 'not measured yet'}>
                  {measured ? score : '–'}
                </span>
                {!measured && <span className="param-missing">not yet</span>}
              </span>
              {SCORE_COLUMNS.map((s) => (
                <span key={s} className={`board-col ${s > param.max ? 'out' : ''}`} aria-hidden="true">
                  {measured && score === s && <span className="pin" data-thread={thread++} />}
                </span>
              ))}
            </li>
          );
        })}
      </ul>
      <p className="board-total">
        {news2.total === null && news2.provisional.total === null ? (
          <>NEWS2 needs all seven parameters; none is measured yet</>
        ) : partial ? (
          <>
            NEWS2 <strong className="num">≥ {news2.provisional.total}</strong> so far · at least {RISK_TEXT[news2.provisional.risk!]} clinical
            risk · <span className="num">{missing}</span> of 7 parameters missing
          </>
        ) : (
          <>
            NEWS2 <strong className="num">{news2.total}</strong> · {RISK_TEXT[news2.risk!]} clinical risk
            {riskPriority && <> · gives {PRIORITIES.find((p) => p.code === riskPriority)!.name} (WEST-A p. 6)</>}
          </>
        )}
      </p>
      {lead && !choice && (
        <p className={`board-lead ${lead.final ? '' : 'is-floor'}`}>
          {lead.final ? (
            <>
              By these rules: <strong>{PRIORITIES.find((p) => p.code === lead.code)!.name}</strong>
            </>
          ) : (
            <>
              So far: at least <strong>{PRIORITIES.find((p) => p.code === lead.code)!.name}</strong>
              {lead.code === '1' || lead.code === '2'
                ? ', and that holds: a red or orange patient is never lowered'
                : ', a lower bound: what is still missing can only raise it'}
            </>
          )}
        </p>
      )}
      <PriorityRow
        choice={choice}
        riskPriority={riskPriority}
        riskLabel={riskPriority === undefined ? '' : partial ? `NEWS2 ≥ ${news2.provisional.total} so far` : `NEWS2 ${news2.total}`}
        partial={partial}
        lead={lead}
        threadIndex={thread}
        sources={sources}
      />
      <svg className="thread" width={path.w} height={path.h} aria-hidden="true">
        <path d={path.d} className="thread-shadow" />
        <path d={path.d} className="thread-line" />
        <path d={path.d} className="thread-twist" />
      </svg>
    </div>
  );
}

function PriorityRow({
  choice,
  riskPriority,
  riskLabel,
  partial,
  lead,
  threadIndex,
  sources,
}: {
  choice?: Choice;
  riskPriority?: PriorityCode;
  riskLabel: string;
  partial: boolean;
  lead?: { code: PriorityCode; final: boolean };
  threadIndex: number;
  sources: SourcePin[];
}) {
  const pins = (code: PriorityCode) => (
    <span className="prio-pins">
      {riskPriority === code && (
        <span className="prio-pin">
          <span className={`pin ${partial ? 'pin-hollow' : ''}`} data-thread={threadIndex} />
          <span className="pin-label">{riskLabel}</span>
        </span>
      )}
      {sources
        .filter((s) => s.priority === code)
        .map((s) => (
          <span className="prio-pin" key={s.label}>
            <span className="pin pin-square" />
            <span className="pin-label">{s.label}</span>
          </span>
        ))}
    </span>
  );

  if (!choice) {
    return (
      <div className="prio" aria-hidden="true">
        <span className="prio-label">WEST-A priority</span>
        {PRIORITIES.map((p) => {
          // Without a lead, the colour NEWS2 gives once complete
          const on = lead ? lead.final && lead.code === p.code : !partial && riskPriority === p.code;
          const floor = !!lead && !lead.final && lead.code === p.code;
          return (
            <div key={p.code} className={`prio-cell state-${p.key} ${on ? 'is-on' : ''} ${floor ? 'is-floor' : ''}`}>
              <span className="prio-name">{p.name}</span>
              {floor && <span className="prio-note">at least</span>}
              {pins(p.code)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <fieldset className="prio">
      <legend className="sr-only">Triage priority to record</legend>
      <span className="prio-label" aria-hidden="true">
        WEST-A priority
      </span>
      {PRIORITIES.map((p) => {
        const closed = choice.closed[p.code];
        const selected = choice.selected === p.code;
        return (
          <label
            key={p.code}
            className={`prio-cell state-${p.key} ${selected ? 'is-selected' : ''} ${closed ? 'is-closed' : ''}`}
          >
            <input
              type="radio"
              name="priority"
              value={p.code}
              checked={selected}
              disabled={!!closed || choice.locked}
              onChange={() => choice.onSelect(p.code)}
              aria-label={`${p.name}${choice.proposed === p.code ? ', proposed' : ''}${closed ? ', closed' : ''}`}
              aria-describedby={closed ? 'closed-reason' : undefined}
            />
            <span className="prio-name">{p.name}</span>
            {choice.proposed === p.code && <span className="prio-note">proposed</span>}
            {selected && choice.proposed && choice.proposed !== p.code && (
              <span className="prio-note">{p.code < choice.proposed ? 'raised' : 'lowered'}</span>
            )}
            {pins(p.code)}
          </label>
        );
      })}
    </fieldset>
  );
}

/** A value like "A · Mentally alert": the gloss after the dot is hidden on a phone, kept for screen readers. */
function ValueText({ text }: { text: string }) {
  const [head, gloss] = text.split(' · ');
  return gloss ? (
    <>
      {head}
      <span className="param-gloss"> · {gloss}</span>
    </>
  ) : (
    <>{text}</>
  );
}
