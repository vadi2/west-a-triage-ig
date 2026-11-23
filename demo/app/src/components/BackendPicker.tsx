import { useState, type FormEvent } from 'react';
import { BACKEND, ENGINE_TEXT, PUBLIC_HAPI, switchBackend, useEngine, type BackendKind } from '../services/backend';

const host = PUBLIC_HAPI.replace(/^https?:\/\//, '').split('/')[0];

/** Where the demo keeps its data: shown on the patient list, and changed there. */
export function BackendPicker() {
  const engine = useEngine();
  const [kind, setKind] = useState<BackendKind>(BACKEND.kind);
  const [url, setUrl] = useState(BACKEND.kind === 'custom' ? BACKEND.base : '/fhir');

  function submit(e: FormEvent) {
    e.preventDefault();
    switchBackend(kind === 'custom' ? { kind, url: url.trim() } : { kind });
  }

  const unchanged = kind === BACKEND.kind && (kind !== 'custom' || url.trim().replace(/\/+$/, '') === BACKEND.base);

  return (
    <section className="backend" aria-labelledby="backend">
      <h2 id="backend">Where the data lives</h2>
      <p className="backend-now">
        <strong>{BACKEND.label}</strong>
        {engine && <> · {ENGINE_TEXT[engine]}</>}
      </p>
      {BACKEND.kind === 'public' && (
        <p className="quiet">
          Anyone can see and change the data on the public sandbox, and it is purged regularly. Synthetic patients only; the
          list shows only the ones this demo made.
        </p>
      )}
      <details>
        <summary>Change</summary>
        <form onSubmit={submit} className="fields">
          <fieldset>
            <legend>Keep the demo&rsquo;s data on</legend>
            <label className="inline">
              <input type="radio" name="backend" checked={kind === 'public'} onChange={() => setKind('public')} />
              the public HAPI sandbox ({host})
            </label>
            <label className="inline">
              <input type="radio" name="backend" checked={kind === 'browser'} onChange={() => setKind('browser')} />
              this browser only
            </label>
            <label className="inline">
              <input type="radio" name="backend" checked={kind === 'custom'} onChange={() => setKind('custom')} />
              another FHIR R4 server
            </label>
          </fieldset>
          {kind === 'custom' && (
            <label>
              FHIR base URL
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/fhir" required spellCheck={false} />
            </label>
          )}
          <p className="quiet">
            {kind === 'public' && 'Shared with everyone, purged regularly. The guideline runs in this browser.'}
            {kind === 'browser' && "Kept in this browser's storage, seeded with the guide's examples. The guideline runs in this browser."}
            {kind === 'custom' &&
              'The local HAPI is /fhir (proxied by the dev and preview servers); another server needs CORS. The guideline runs on the server when it offers Library/$evaluate and PlanDefinition/$apply and has the guide loaded, else in this browser.'}
          </p>
          <div className="row">
            <button type="submit" disabled={unchanged}>
              Switch and reload
            </button>
          </div>
        </form>
      </details>
    </section>
  );
}
