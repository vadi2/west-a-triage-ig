import type { TriageAnswers } from './answers';
import type { Risk } from './priority';

/**
 * The NEWS2 parameters in chart order, keyed by the CQL define names that runTriage returns in
 * `news2.scores` (WestANEWS2.cql). `max` is the highest score the parameter can give.
 */
export const PARAMETERS = [
  { key: 'Respiration Rate Score', label: 'Respiration rate', unit: '/min', max: 3 },
  { key: 'Oxygen Saturation Score', label: 'SpO₂', unit: '%', max: 3 },
  { key: 'Supplemental Oxygen Score', label: 'Air or oxygen', unit: '', max: 2 },
  { key: 'Systolic Blood Pressure Score', label: 'Systolic BP', unit: 'mmHg', max: 3 },
  { key: 'Pulse Score', label: 'Pulse', unit: '/min', max: 3 },
  { key: 'Consciousness Score', label: 'Consciousness', unit: '', max: 3 },
  { key: 'Temperature Score', label: 'Temperature', unit: '°C', max: 3 },
] as const;

export type ScoreKey = (typeof PARAMETERS)[number]['key'];
export type Scores = Partial<Record<ScoreKey, number | null>>;

export interface News2 {
  total: number | null;
  risk: Risk | null;
  scores: Scores;
}

const ALERT = '248234008';

// The thresholds of the RCP NEWS2 chart, as WestANEWS2.cql has them, so mock mode and the
// live preview agree with the guideline running on the server.
const band = (v: number | undefined, f: (x: number) => number) => (v === undefined ? null : f(Math.round(v)));

export function scoreRespiration(v?: number) {
  return band(v, (r) => (r <= 8 ? 3 : r <= 11 ? 1 : r <= 20 ? 0 : r <= 24 ? 2 : 3));
}
export function scoreSpO2(v: number | undefined, scale2: boolean, onOxygen: boolean | undefined) {
  if (!scale2) return band(v, (s) => (s <= 91 ? 3 : s <= 93 ? 2 : s <= 95 ? 1 : 0));
  return band(v, (s) => {
    if (s <= 83) return 3;
    if (s <= 85) return 2;
    if (s <= 87) return 1;
    if (s <= 92 || !onOxygen) return 0;
    return s <= 94 ? 1 : s <= 96 ? 2 : 3;
  });
}
export function scoreSystolic(v?: number) {
  return band(v, (s) => (s <= 90 ? 3 : s <= 100 ? 2 : s <= 110 ? 1 : s <= 219 ? 0 : 3));
}
export function scorePulse(v?: number) {
  return band(v, (p) => (p <= 40 ? 3 : p <= 50 ? 1 : p <= 90 ? 0 : p <= 110 ? 1 : p <= 130 ? 2 : 3));
}
export function scoreTemperature(v?: number) {
  if (v === undefined) return null;
  const t = Math.round(v * 10) / 10;
  return t <= 35.0 ? 3 : t <= 36.0 ? 1 : t <= 38.0 ? 0 : t <= 39.0 ? 1 : 2;
}

export function news2(a: TriageAnswers): News2 {
  const onOxygen = a.oxygenFlow === undefined ? undefined : a.oxygenFlow > 0;
  const scores: Scores = {
    'Respiration Rate Score': scoreRespiration(a.respiratoryRate),
    'Oxygen Saturation Score': scoreSpO2(a.oxygenSaturation, a.scale2, onOxygen),
    'Supplemental Oxygen Score': onOxygen === undefined ? null : onOxygen ? 2 : 0,
    'Systolic Blood Pressure Score': scoreSystolic(a.systolic),
    'Pulse Score': scorePulse(a.heartRate),
    'Consciousness Score': a.consciousness ? (a.consciousness.code === ALERT ? 0 : 3) : null,
    'Temperature Score': scoreTemperature(a.temperature),
  };
  const values = Object.values(scores);
  const complete = values.length === 7 && values.every((s) => typeof s === 'number');
  const total = complete ? (values as number[]).reduce((x, y) => x + y, 0) : null;
  const risk: Risk | null =
    total === null ? null : total >= 7 ? 'high' : total >= 5 ? 'medium' : values.includes(3) ? 'low-medium' : 'low';
  return { total, risk, scores };
}

/** The measured value of a parameter, as the nurse entered it, for the chart. */
export function displayValue(key: ScoreKey, a: TriageAnswers): string {
  switch (key) {
    case 'Respiration Rate Score':
      return fmt(a.respiratoryRate);
    case 'Oxygen Saturation Score':
      return fmt(a.oxygenSaturation) + (a.scale2 ? ' (scale 2)' : '');
    case 'Supplemental Oxygen Score':
      return a.oxygenFlow === undefined ? '–' : a.oxygenFlow > 0 ? `O₂ ${a.oxygenFlow} L/min` : 'Room air';
    case 'Systolic Blood Pressure Score':
      return fmt(a.systolic) + (a.diastolic !== undefined ? `/${a.diastolic}` : '');
    case 'Pulse Score':
      return fmt(a.heartRate);
    case 'Consciousness Score':
      return a.consciousness ? acvpuLetter(a.consciousness.code) : '–';
    case 'Temperature Score':
      return a.temperature === undefined ? '–' : a.temperature.toFixed(1);
  }
}

const fmt = (v?: number) => (v === undefined ? '–' : String(v));

export const ACVPU: { code: string; letter: string; display: string }[] = [
  { code: '248234008', letter: 'A', display: 'Mentally alert' },
  { code: '130987000', letter: 'C', display: 'Acute confusion' },
  { code: '300202002', letter: 'V', display: 'Responds to voice' },
  { code: '450847001', letter: 'P', display: 'Responds to pain' },
  { code: '422768004', letter: 'U', display: 'Unresponsive' },
];

export const acvpuLetter = (code?: string) => {
  const a = ACVPU.find((x) => x.code === code);
  return a ? `${a.letter} · ${a.display}` : (code ?? '–');
};
