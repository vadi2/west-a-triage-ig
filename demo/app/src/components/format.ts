/** 08:38, in the hospital's 24-hour clock. */
export const clock = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : '–';

/** 19 Nov 2026 08:38 */
export const stamp = (iso?: string) =>
  iso
    ? `${new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} ${clock(iso)}`
    : '–';
