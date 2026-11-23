import { BACKEND } from '../services/backend';
import { FhirError } from '../services/fhirClient';

// A resource that is not there (any more): read as 404 or 410, or referred to in a write,
// which HAPI refuses with HAPI-1094 "Resource Patient/… not found, specified in path: …" or
// HAPI-1096 "… is deleted"
const GONE = /HAPI-109[0-9]|not found, specified in path|is deleted|has been deleted/i;

export function isGone(e: unknown): boolean {
  return (
    e instanceof FhirError &&
    (e.status === 404 || e.status === 410 || ([400, 409, 412, 422].includes(e.status) && e.issues.some((i) => GONE.test(i))))
  );
}

/** A server or library error, shown as it came, so the nurse or the developer can act on it. */
export function ErrorNote({ error, what }: { error: unknown; what: string }) {
  if (!error) return null;
  const e = error as Error;
  return (
    <div className="error" role="alert">
      <p>
        <strong>{what} failed.</strong>
      </p>
      {isGone(error) && (
        // Reloading also restores the nurse, should the purge have taken it (prepareServer)
        <p>
          {BACKEND.kind === 'public'
            ? 'The public HAPI sandbox no longer has this record: it is purged regularly, and anyone can delete data there. '
            : 'The server no longer has this record. '}
          <a href="#/patients" onClick={() => window.setTimeout(() => window.location.reload())}>
            Start again from the patient list
          </a>
          , with a new synthetic patient if yours is gone.
        </p>
      )}
      {e instanceof FhirError ? (
        <>
          <p className="num">
            {e.request} → {e.status === 0 ? 'no response' : `HTTP ${e.status}`}
          </p>
          {e.issues.length > 0 && (
            <ul>
              {e.issues.map((i, n) => (
                <li key={n}>{i}</li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p>{e?.message ?? String(error)}</p>
      )}
    </div>
  );
}
