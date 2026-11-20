import { FhirError } from '../services/fhirClient';

/** A server or library error, shown as it came, so the nurse or the developer can act on it. */
export function ErrorNote({ error, what }: { error: unknown; what: string }) {
  if (!error) return null;
  const e = error as Error;
  return (
    <div className="error" role="alert">
      <p>
        <strong>{what} failed.</strong>
      </p>
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
