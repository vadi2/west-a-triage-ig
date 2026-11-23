import { useEffect, useState } from 'react';
import type { Bundle, CapabilityStatement, Coding, Practitioner, Resource } from 'fhir/r4';
import { IG, NURSE } from './config';
import { FhirError, httpClient, type FhirClient } from './fhirClient';
import { mockClient } from './mockServer';

/*
 * Where the app keeps its data, chosen at runtime and remembered in this browser:
 *
 * - public: the public HAPI FHIR sandbox (https://hapi.fhir.org/baseR4). Anyone can read and
 *   change what is there, and it is purged regularly. It has no clinical reasoning, so the
 *   guideline runs in the browser. The patient list shows only the patients this app made.
 * - browser: an in-memory store kept in this browser's localStorage (services/mockServer.ts).
 * - custom: any FHIR R4 base URL, such as the local HAPI behind /fhir (vite.config.ts).
 *
 * The guideline runs on the server when its CapabilityStatement offers Library/$evaluate and
 * PlanDefinition/$apply, and otherwise in the browser, on the guide's own CQL
 * (services/guideline.ts).
 */
export type BackendKind = 'public' | 'browser' | 'custom';

export interface BackendChoice {
  kind: BackendKind;
  /** The FHIR base of a custom server. */
  url?: string;
}

export interface Backend extends BackendChoice {
  base: string;
  /** For the header: which store this is. */
  label: string;
  /** A server shared with strangers: show only this app's patients, and say so. */
  shared: boolean;
}

export const PUBLIC_HAPI = 'https://hapi.fhir.org/baseR4';

/** Every resource the app creates carries this tag (and synthetic patients HTEST too). */
export const DEMO_TAG: Coding = { system: `${IG}/demo`, code: 'west-a-demo', display: 'WEST-A triage demo' };
export const DEMO_TAG_PARAM = `${DEMO_TAG.system}|${DEMO_TAG.code}`;

const KEY = 'west-a-backend';

/** The build's default: VITE_BACKEND (public, browser or custom), VITE_MOCK=1, or VITE_FHIR_BASE. */
export function defaultChoice(): BackendChoice {
  const env = import.meta.env;
  const kind = env.VITE_BACKEND as BackendKind | undefined;
  if (kind === 'public' || kind === 'browser') return { kind };
  if (env.VITE_MOCK === '1') return { kind: 'browser' };
  return { kind: 'custom', url: env.VITE_FHIR_BASE || '/fhir' };
}

function storedChoice(): BackendChoice | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    const c = raw ? (JSON.parse(raw) as BackendChoice) : undefined;
    if (c?.kind === 'public' || c?.kind === 'browser' || (c?.kind === 'custom' && c.url)) return c;
  } catch {
    /* no storage, or not ours: the default */
  }
  return undefined;
}

function store(c: BackendChoice): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
    return true;
  } catch {
    return false;
  }
}

/**
 * ?server=public, ?server=browser or ?server=<FHIR base URL> in the page URL: a link that opens
 * the demo on a given store. It is remembered like a choice made in the app.
 */
function linkedChoice(): BackendChoice | undefined {
  const s = new URLSearchParams(window.location.search).get('server');
  if (!s) return undefined;
  const c: BackendChoice = s === 'public' || s === 'browser' ? { kind: s } : { kind: 'custom', url: s };
  store(c);
  return c;
}

/**
 * Remembers the choice and starts the app afresh on it, on the patient list. Without
 * storage, the choice goes into the page URL instead (?server=).
 */
export function switchBackend(c: BackendChoice) {
  const url = new URL(window.location.href);
  url.searchParams.delete('server');
  if (!store(c)) url.searchParams.set('server', c.kind === 'custom' ? c.url! : c.kind);
  url.hash = '#/patients';
  if (url.search === window.location.search) {
    window.location.hash = url.hash;
    window.location.reload();
  } else window.location.assign(url.toString());
}

function resolve(c: BackendChoice): Backend {
  switch (c.kind) {
    case 'public':
      return { kind: 'public', base: PUBLIC_HAPI, label: 'public HAPI sandbox', shared: true };
    case 'browser':
      return { kind: 'browser', base: 'browser', label: 'this browser only', shared: false };
    case 'custom': {
      const base = (c.url ?? '/fhir').replace(/\/+$/, '');
      const label = base.startsWith('/') ? `${base} (local HAPI)` : base.replace(/^https?:\/\//, '');
      return { kind: 'custom', url: base, base, label, shared: false };
    }
  }
}

export const BACKEND: Backend = resolve(linkedChoice() ?? storedChoice() ?? defaultChoice());

/* ------------------------------------------------------------------ the client */

const withTag = <T extends Resource>(r: T): T =>
  r.meta?.tag?.some((t) => t.system === DEMO_TAG.system && t.code === DEMO_TAG.code)
    ? r
    : { ...r, meta: { ...r.meta, tag: [...(r.meta?.tag ?? []), DEMO_TAG] } };

/**
 * Tags every resource written with DEMO_TAG, and on a server first makes sure that what the
 * app refers to but never creates (the triage nurse) is there.
 */
function demoClient(inner: FhirClient, ready: () => Promise<void>): FhirClient {
  return {
    ...inner,
    create: async (r) => (await ready(), inner.create(withTag(r))),
    update: async (r) => (await ready(), inner.update(withTag(r))),
    transaction: async (b: Bundle) => {
      await ready();
      return inner.transaction({
        ...b,
        entry: b.entry?.map((e) => (e.resource && e.request?.method !== 'DELETE' ? { ...e, resource: withTag(e.resource) } : e)),
      });
    },
  };
}

const raw: FhirClient = BACKEND.kind === 'browser' ? mockClient() : httpClient(BACKEND.base);

let prepared: Promise<void> | undefined;

/**
 * Creates, by PUT with its id, each resource the app refers to but does not create, when the
 * server does not have it (a fresh or purged public sandbox): the nurse, the author of every
 * QuestionnaireResponse and the performer of every Observation.
 */
export function prepareServer(): Promise<void> {
  if (BACKEND.kind === 'browser') return Promise.resolve();
  prepared ??= (async () => {
    try {
      await raw.read<Practitioner>('Practitioner', NURSE.id);
    } catch (e) {
      if (!(e instanceof FhirError) || (e.status !== 404 && e.status !== 410)) throw e;
      await raw.update<Practitioner>(
        withTag({
          resourceType: 'Practitioner',
          id: NURSE.id,
          language: 'sv',
          name: [{ family: NURSE.family, given: [NURSE.given], text: NURSE.name }],
        }),
      );
    }
  })();
  prepared.catch(() => (prepared = undefined));
  return prepared;
}

export const client: FhirClient = demoClient(raw, prepareServer);

/* ------------------------------------------------------------------ the guideline engine */

export type Engine = 'server' | 'browser';

let engine: Promise<Engine> | undefined;

const offers = (cs: CapabilityStatement, type: string, op: string) =>
  !!cs.rest?.some((rest) =>
    rest.resource?.some((r) => r.type === type && r.operation?.some((o) => o.name.replace(/^\$/, '') === op)),
  );

/**
 * Where the guideline runs: on the server when it offers Library/$evaluate and
 * PlanDefinition/$apply (HAPI with clinical reasoning) and holds the guide's PlanDefinition
 * (demo/hapi/load.mjs), else in this browser. Never on the public sandbox: it has no clinical
 * reasoning, and anyone could change the guide's Libraries there.
 */
export function guidelineEngine(): Promise<Engine> {
  if (BACKEND.kind === 'browser' || BACKEND.kind === 'public') return Promise.resolve('browser');
  engine ??= (async (): Promise<Engine> => {
    try {
      const res = await fetch(`${BACKEND.base}/metadata`, { headers: { Accept: 'application/fhir+json' } });
      if (!res.ok) return 'browser';
      const cs = (await res.json()) as CapabilityStatement;
      if (!offers(cs, 'Library', 'evaluate') || !offers(cs, 'PlanDefinition', 'apply')) return 'browser';
      const plan = await fetch(`${BACKEND.base}/PlanDefinition/west-a-triage`, { headers: { Accept: 'application/fhir+json' } });
      return plan.ok ? 'server' : 'browser';
    } catch {
      // No answer: the next call asks again, and the browser runs it meanwhile
      engine = undefined;
      return 'browser';
    }
  })();
  return engine;
}

/** The engine, for display; undefined until the server has answered. */
export function useEngine(): Engine | undefined {
  const [e, setE] = useState<Engine>();
  useEffect(() => {
    let live = true;
    void guidelineEngine().then((x) => live && setE(x));
    return () => {
      live = false;
    };
  }, []);
  return e;
}

export const ENGINE_TEXT: Record<Engine, string> = {
  server: 'guideline on the server',
  browser: 'guideline in this browser',
};

/** An absolute URL for the FHIR base, for libraries that cannot take a relative one. */
export function absoluteBase(): string {
  const base = BACKEND.kind === 'browser' ? 'fhir' : BACKEND.base;
  return new URL(base, document.baseURI).toString().replace(/\/$/, '');
}

/**
 * Where a resource can be opened in a browser tab: its URL on the FHIR server, or undefined
 * for the store in this browser, which has no URL.
 */
export function resourceUrl(type: string, id: string): string | undefined {
  if (BACKEND.kind === 'browser') return undefined;
  return `${absoluteBase()}/${type}/${encodeURIComponent(id)}`;
}

/** Everything the server holds about a patient (Patient/$everything), or undefined in this browser. */
export function everythingUrl(patientId: string): string | undefined {
  const patient = resourceUrl('Patient', patientId);
  return patient && `${patient}/$everything?_count=500`;
}
