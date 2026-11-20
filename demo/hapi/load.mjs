#!/usr/bin/env node
// Load this guide's package into a FHIR server, with PUT by id so that it is idempotent.
//
//   node demo/hapi/load.mjs [package.tgz | url]      (Node 20, no dependencies)
//
// The default is the CI build on build.fhir.org. FHIR_BASE (default
// http://localhost:8080/fhir) is the server. The conformance and knowledge resources
// (CodeSystems, ValueSets, StructureDefinitions, Libraries, PlanDefinitions,
// ActivityDefinitions, the Questionnaire) go in one transaction, the examples (Patient,
// Practitioner, Encounter, Observations) in a second, so the references between examples
// resolve within the transaction.

import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

const DEFAULT_PACKAGE = 'https://build.fhir.org/ig/vadi2/west-a-triage-ig/package.tgz';
const BASE = (process.env.FHIR_BASE || 'http://localhost:8080/fhir').replace(/\/$/, '');

// The resource types of the guide itself that the server needs; the ImplementationGuide
// resource and anything else outside this list is skipped.
const CONFORMANCE = [
  'CodeSystem', 'ValueSet', 'ConceptMap', 'NamingSystem', 'SearchParameter',
  'StructureDefinition', 'Library', 'ActivityDefinition', 'PlanDefinition', 'Questionnaire',
];

async function readPackage(source) {
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`GET ${source}: ${res.status} ${res.statusText}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(source);
}

// A minimal ustar reader: [{ name, data }] for the regular files of the archive
function untar(buffer) {
  const files = [];
  let offset = 0;
  let longName = null;
  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break;
    const field = (start, length) => header.subarray(start, start + length).toString('utf8').replace(/\0.*$/s, '');
    let name = field(0, 100);
    const prefix = field(345, 155);
    if (prefix) name = `${prefix}/${name}`;
    const size = parseInt(field(124, 12).trim() || '0', 8);
    const type = String.fromCharCode(header[156] || 48);
    const data = buffer.subarray(offset + 512, offset + 512 + size);
    if (type === 'L') longName = data.toString('utf8').replace(/\0.*$/s, '');
    else if (type === 'x' || type === 'g') {
      const path = /\d+ path=([^\n]*)\n/.exec(data.toString('utf8'));
      if (path) longName = path[1];
    } else {
      if (longName) { name = longName; longName = null; }
      if (type === '0' || type === '\0') files.push({ name, data });
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return files;
}

// The FHIRHelpers Library must carry the version that the CQL includes ('4.0.1'), but the
// IG Publisher stamps every canonical resource with the guide's version: take the version
// from the CQL source of a Library when they differ.
function fixLibraryVersion(library) {
  const cql = library.content?.find((c) => c.contentType === 'text/cql' && c.data);
  if (!cql) return;
  const source = Buffer.from(cql.data, 'base64').toString('utf8');
  const m = /^\s*library\s+("[^"]+"|[A-Za-z_][\w]*)\s+version\s+'([^']+)'/m.exec(source);
  if (m && m[2] !== library.version) {
    console.log(`  Library/${library.id}: version ${library.version} -> ${m[2]}, as in its CQL`);
    library.version = m[2];
  }
}

export async function loadPackage(source = DEFAULT_PACKAGE, base = BASE) {
  const files = untar(gunzipSync(await readPackage(source)));
  const conformance = [];
  const examples = [];
  for (const { name, data } of files) {
    const m = /^package\/(?:(examples?)\/)?([^/]+\.json)$/.exec(name);
    if (!m || m[2].startsWith('.') || m[2] === 'package.json') continue;
    let resource;
    try { resource = JSON.parse(data.toString('utf8')); } catch { continue; }
    if (!resource?.resourceType || !resource.id) continue;
    if (m[1]) examples.push(resource);
    else if (CONFORMANCE.includes(resource.resourceType)) conformance.push(resource);
  }
  for (const library of conformance.filter((r) => r.resourceType === 'Library')) fixLibraryVersion(library);
  conformance.sort((a, b) => CONFORMANCE.indexOf(a.resourceType) - CONFORMANCE.indexOf(b.resourceType));

  const summary = {};
  for (const [label, resources] of [['conformance', conformance], ['examples', examples]]) {
    if (!resources.length) continue;
    const bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: resources.map((resource) => ({
        fullUrl: `${base}/${resource.resourceType}/${resource.id}`,
        resource,
        request: { method: 'PUT', url: `${resource.resourceType}/${resource.id}` },
      })),
    };
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/fhir+json', Accept: 'application/fhir+json' },
      body: JSON.stringify(bundle),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const issues = body?.issue?.map((i) => `${i.severity}: ${i.diagnostics}`).join('\n') ?? '';
      throw new Error(`Loading the ${label} failed: ${res.status} ${res.statusText}\n${issues}`);
    }
    const statuses = body.entry.map((e) => e.response.status.split(' ')[0]);
    const counts = {};
    for (const s of statuses) counts[s] = (counts[s] || 0) + 1;
    summary[label] = resources.length;
    const types = {};
    for (const r of resources) types[r.resourceType] = (types[r.resourceType] || 0) + 1;
    console.log(`Loaded ${resources.length} ${label} resources (${Object.entries(types).map(([t, n]) => `${n} ${t}`).join(', ')}); status ${JSON.stringify(counts)}`);
  }
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const source = process.argv[2] || DEFAULT_PACKAGE;
  console.log(`Loading ${source} into ${BASE}`);
  loadPackage(source).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
