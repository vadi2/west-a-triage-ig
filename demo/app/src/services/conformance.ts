import type { Bundle, CodeSystem, FhirResource, Questionnaire, Resource, ValueSet } from 'fhir/r4';
import questionnaire from '../fixtures/questionnaire.json';
import acvpuVs from '../fixtures/terminology/ValueSet-west-a-acvpu-vs.json';
import complaintVs from '../fixtures/terminology/ValueSet-west-a-chief-complaint-vs.json';
import priorityVs from '../fixtures/terminology/ValueSet-west-a-triage-priority-vs.json';
import complaintCs from '../fixtures/terminology/CodeSystem-west-a-chief-complaint-cs.json';
import priorityCs from '../fixtures/terminology/CodeSystem-west-a-triage-priority-cs.json';
import criterionCs from '../fixtures/terminology/CodeSystem-west-a-triage-criterion-cs.json';
import { BACKEND, client } from './backend';
import { entries, FhirError, type FhirClient } from './fhirClient';

/**
 * The guide's Questionnaire, ValueSets and CodeSystems that the app reads, copied from the
 * built IG package (scripts/ig-assets.mjs).
 */
export const BUNDLED: FhirResource[] = [
  questionnaire as Questionnaire,
  ...([acvpuVs, complaintVs, priorityVs] as ValueSet[]),
  ...([complaintCs, priorityCs, criterionCs] as CodeSystem[]),
];

const later = <T,>(value: T) => Promise.resolve(structuredClone(value));

/** The bundled copies as a read-only FHIR store: read by id, search by url (and version). */
function bundledClient(): FhirClient {
  const find = (type: string, test: (r: Resource & { url?: string; version?: string }) => boolean) =>
    BUNDLED.filter((r) => r.resourceType === type && test(r as Resource & { url?: string }));
  const readOnly = () => Promise.reject(new Error('The bundled copies of the guide are read-only'));
  return {
    base: 'bundled',
    read: async (type, id) => {
      const r = find(type, (x) => x.id === id)[0];
      if (!r) throw new FhirError(404, `GET ${type}/${id}`, [`${type}/${id} is not bundled with the app`]);
      return later(r as never);
    },
    search: async (type, params = {}) => {
      const found = find(type, (r) => (!params.url || r.url === params.url) && (!params.version || r.version === params.version));
      const bundle: Bundle = { resourceType: 'Bundle', type: 'searchset', total: found.length, entry: found.map((resource) => ({ resource })) };
      return later(bundle as never);
    },
    create: readOnly,
    update: readOnly,
    transaction: readOnly,
    operation: readOnly,
  };
}

/** A server's copy of the guide's resources, or the bundled one when the server has none. */
function withFallback(server: FhirClient, bundled: FhirClient): FhirClient {
  return {
    ...server,
    read: async (type, id) => {
      try {
        return await server.read(type, id);
      } catch (e) {
        if (e instanceof FhirError && (e.status === 404 || e.status === 410)) return bundled.read(type, id);
        throw e;
      }
    },
    search: async <T extends Resource>(type: string, params?: Record<string, string>) => {
      const found = await server.search<T>(type, params);
      return entries(found).length ? found : bundled.search<T>(type, params);
    },
  };
}

/**
 * Where the app reads the guide's Questionnaire and terminology. A custom server is asked
 * first (the local HAPI holds the guide, demo/hapi/load.mjs). The public sandbox is never
 * asked: anyone can change what is there. The in-browser store would keep the copies of the
 * build that first seeded it, so it is not asked either.
 */
export const conformance: FhirClient = BACKEND.kind === 'custom' ? withFallback(client, bundledClient()) : bundledClient();
