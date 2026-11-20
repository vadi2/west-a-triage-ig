import type { Bundle, FhirResource, OperationOutcome, Parameters, Resource } from 'fhir/r4';

/**
 * The app's FHIR client: `httpClient` for a server, `mockClient` (services/mockServer.ts) for
 * the in-browser store. runTriage in real mode uses the client of demo/lib/cds.js instead.
 */
export interface FhirClient {
  base: string;
  read<T extends Resource = FhirResource>(type: string, id: string): Promise<T>;
  search<T extends Resource = FhirResource>(type: string, params?: Record<string, string>): Promise<Bundle<T>>;
  create<T extends Resource>(resource: T): Promise<T>;
  update<T extends Resource>(resource: T): Promise<T>;
  transaction(bundle: Bundle): Promise<Bundle>;
  /** `$name` on the base, a type, or an instance; POST with Parameters, or GET without. */
  operation<T = Resource>(op: { name: string; type?: string; id?: string; parameters?: Parameters; method?: 'GET' | 'POST' }): Promise<T>;
}

/** A failed server call, with what the server said about it. */
export class FhirError extends Error {
  constructor(
    readonly status: number,
    readonly request: string,
    readonly issues: string[],
    readonly outcome?: OperationOutcome,
  ) {
    super(`${request} failed with HTTP ${status}${issues.length ? ': ' + issues.join('; ') : ''}`);
    this.name = 'FhirError';
  }
}

export function outcomeMessages(outcome: OperationOutcome | undefined): string[] {
  return (outcome?.issue ?? []).map((i) =>
    [i.severity, i.diagnostics ?? i.details?.text ?? i.code, i.expression?.join(', ')].filter(Boolean).join(' · '),
  );
}

export function httpClient(base: string): FhirClient {
  const root = base.replace(/\/$/, '');

  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const label = `${method} ${path.split('?')[0]}`;
    let res: Response;
    try {
      res = await fetch(`${root}/${path}`, {
        method,
        headers: {
          Accept: 'application/fhir+json',
          ...(body ? { 'Content-Type': 'application/fhir+json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new FhirError(0, label, [`no answer from ${root} (${(e as Error).message})`]);
    }
    const text = await res.text();
    let json: unknown = undefined;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        if (!res.ok) throw new FhirError(res.status, label, [text.slice(0, 300)]);
      }
    }
    if (!res.ok) {
      const outcome = (json as Resource | undefined)?.resourceType === 'OperationOutcome' ? (json as OperationOutcome) : undefined;
      throw new FhirError(res.status, label, outcome ? outcomeMessages(outcome) : [res.statusText], outcome);
    }
    return json as T;
  }

  const query = (params?: Record<string, string>) =>
    params && Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';

  return {
    base: root,
    read: (type, id) => call('GET', `${type}/${encodeURIComponent(id)}`),
    search: (type, params) => call('GET', `${type}${query(params)}`),
    create: (resource) => call('POST', resource.resourceType, resource),
    update: (resource) => call('PUT', `${resource.resourceType}/${resource.id}`, resource),
    transaction: (bundle) => call('POST', '', bundle),
    operation: ({ name, type, id, parameters, method }) => {
      const path = [type, id, name.startsWith('$') ? name : `$${name}`].filter(Boolean).join('/');
      return method === 'GET' ? call('GET', path) : call('POST', path, parameters ?? { resourceType: 'Parameters' });
    },
  };
}

export function entries<T extends Resource>(bundle: Bundle<T> | undefined): T[] {
  return (bundle?.entry ?? []).map((e) => e.resource).filter((r): r is T => !!r);
}
