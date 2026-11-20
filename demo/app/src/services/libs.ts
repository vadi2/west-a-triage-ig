// The shared modules in demo/lib are written alongside this app. A glob import keeps the build
// working while one of them does not exist yet; a call then fails with a plain message.
const modules = import.meta.glob(['../../../lib/extract.js', '../../../lib/cds.js', '../../../lib/hdr.js']);

export async function loadLib<T>(name: 'extract' | 'cds' | 'hdr'): Promise<T> {
  const loader = modules[`../../../lib/${name}.js`];
  if (!loader) {
    throw new Error(`demo/lib/${name}.js is not in this build. Add it and restart Vite, or run in mock mode (VITE_MOCK=1).`);
  }
  return (await loader()) as T;
}

/** A local id for a resource inside a transaction or document Bundle. */
export const uuid = () => `urn:uuid:${crypto.randomUUID()}`;
