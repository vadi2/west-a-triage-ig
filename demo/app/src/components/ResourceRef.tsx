import type { ReactNode } from 'react';
import { everythingUrl, resourceUrl } from '../services/backend';

/** "Observation/123", linked to the resource as JSON on the FHIR server (plain text in this browser's store). */
export function ResourceRef({ type, id, className = 'num' }: { type: string; id: string | undefined; className?: string }) {
  const text = `${type}/${id ?? '?'}`;
  const href = id ? resourceUrl(type, id) : undefined;
  return href ? (
    <a className={className} href={href} target="_blank" rel="noreferrer" title={`Open ${text} on the FHIR server`}>
      {text}
    </a>
  ) : (
    <span className={className}>{text}</span>
  );
}

/** A link to all the data saved about a patient (Patient/$everything); nothing in this browser's store. */
export function EverythingLink({ patientId, children = 'All data saved for this patient' }: { patientId: string | undefined; children?: ReactNode }) {
  const href = patientId ? everythingUrl(patientId) : undefined;
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" title="Patient/$everything on the FHIR server, as JSON">
      {children}
    </a>
  ) : null;
}
