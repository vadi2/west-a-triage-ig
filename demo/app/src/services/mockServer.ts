import type { Bundle, BundleEntry, FhirResource, Resource } from 'fhir/r4';
import { FhirError, type FhirClient } from './fhirClient';
import { seedResources } from '../fixtures/seed';

// An in-memory FHIR server for mock mode, seeded with the guide's examples. It keeps what the
// app writes in this browser's localStorage, so a reload keeps the demo where it was.
const KEY = 'west-a-mock-db-v2';

type Db = Record<string, Record<string, Resource>>;

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    /* no storage: start from the seed */
  }
  const db: Db = {};
  for (const r of seedResources()) put(db, r);
  return db;
}

function save(db: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage full or blocked: the demo still runs in memory */
  }
}

export function resetMockDb() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing stored */
  }
}

function put(db: Db, r: Resource) {
  (db[r.resourceType] ??= {})[r.id!] = r;
}

let counter = Date.now() % 100000;
const newId = () => `m${(counter++).toString(36)}`;
const later = <T,>(value: T, ms = 250) => new Promise<T>((ok) => setTimeout(() => ok(structuredClone(value)), ms));

function stamp<T extends Resource>(r: T, id: string): T {
  const version = String(Number(r.meta?.versionId ?? 0) + 1);
  return { ...r, id, meta: { ...r.meta, versionId: version, lastUpdated: new Date().toISOString() } };
}

const refId = (v: string) => v.split('/').pop()!;

// Reads a search parameter the way this app uses it; not a general FHIR search.
function matches(r: any, name: string, value: string): boolean {
  switch (name) {
    case 'subject':
    case 'patient':
      return refId(r.subject?.reference ?? '') === refId(value);
    case 'encounter':
      return refId(r.encounter?.reference ?? '') === refId(value);
    case 'code': {
      const wanted = value.split(',').map((v) => v.split('|'));
      const codings = r.code?.coding ?? [];
      return wanted.some(([a, b]) => codings.some((c: any) => (b === undefined ? c.code === a : c.system === a && c.code === b)));
    }
    case 'name': {
      const hay = JSON.stringify(r.name ?? []).toLowerCase();
      return hay.includes(value.toLowerCase());
    }
    case 'identifier': {
      const v = value.includes('|') ? value.split('|')[1] : value;
      return (r.identifier ?? []).some((i: any) => i.value?.includes(v));
    }
    case 'url':
      return r.url === value;
    case 'status':
      return r.status === value;
    case '_id':
      return value.split(',').includes(r.id);
    default:
      return true;
  }
}

const when = (r: any): string =>
  r.effectiveDateTime ?? r.authored ?? r.period?.start ?? r.meta?.lastUpdated ?? '';

export function mockClient(): FhirClient {
  const db = load();

  function create<T extends Resource>(r: T): T {
    const out = stamp(r, r.id && !db[r.resourceType]?.[r.id] ? r.id : newId());
    put(db, out);
    return out;
  }

  function rewriteRefs(node: unknown, map: Map<string, string>): unknown {
    if (Array.isArray(node)) return node.map((n) => rewriteRefs(n, map));
    if (node && typeof node === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node)) {
        out[k] = k === 'reference' && typeof v === 'string' && map.has(v) ? map.get(v) : rewriteRefs(v, map);
      }
      return out;
    }
    return node;
  }

  return {
    base: 'mock',
    async read(type, id) {
      const r = db[type]?.[id];
      if (!r) {
        await later(null, 120);
        throw new FhirError(404, `GET ${type}/${id}`, [`error · Resource ${type}/${id} is not known`]);
      }
      return later(r as any, 120);
    },
    async search(type, params = {}) {
      const { _count, _sort, ...filters } = params;
      let found = Object.values(db[type] ?? {}).filter((r) => Object.entries(filters).every(([k, v]) => matches(r, k, v)));
      if (_sort) {
        const desc = _sort.startsWith('-');
        found.sort((a, b) => (desc ? -1 : 1) * when(a).localeCompare(when(b)));
      }
      if (_count) found = found.slice(0, Number(_count));
      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: found.length,
        entry: found.map((resource) => ({ fullUrl: `mock/${type}/${resource.id}`, resource: resource as FhirResource, search: { mode: 'match' } })),
      };
      return later(bundle as any);
    },
    async create(r) {
      const out = create(r);
      save(db);
      return later(out);
    },
    async update(r) {
      if (!r.id) throw new FhirError(400, `PUT ${r.resourceType}`, ['error · update needs an id']);
      const out = stamp(r, r.id);
      put(db, out);
      save(db);
      return later(out);
    },
    async transaction(bundle) {
      if (bundle.type !== 'transaction') {
        throw new FhirError(400, 'POST /', [`error · Bundle.type is ${bundle.type}, the server takes a transaction here`]);
      }
      const map = new Map<string, string>();
      const entries = bundle.entry ?? [];
      // Assign ids first, so references between entries resolve in any order
      const ids = entries.map((e) => {
        const r = e.resource!;
        const id = e.request?.method === 'PUT' ? refId(e.request.url) : newId();
        if (e.fullUrl) map.set(e.fullUrl, `${r.resourceType}/${id}`);
        return id;
      });
      const response: BundleEntry[] = entries.map((e, i) => {
        const r = rewriteRefs(e.resource, map) as Resource;
        const out = stamp(r, ids[i]);
        put(db, out);
        return {
          resource: out as FhirResource,
          response: { status: e.request?.method === 'PUT' ? '200 OK' : '201 Created', location: `${out.resourceType}/${out.id}/_history/${out.meta!.versionId}` },
        };
      });
      save(db);
      return later({ resourceType: 'Bundle', type: 'transaction-response', entry: response } as Bundle, 400);
    },
    async operation({ name }) {
      throw new FhirError(501, name, [`error · mock mode does not run ${name}; the adapters compute it locally`]);
    },
  };
}
