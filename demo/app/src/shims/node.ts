// The Node built-ins that the CQL engine's model-info loader (cql-exec-fhir → xml2js → sax)
// asks for, as far as it uses them in a browser: vite.config.ts points `timers`, `stream`,
// `string_decoder` and `fs` here. `events` is the npm package of the same name.

/** timers.setImmediate, for xml2js */
export const setImmediate = (fn: (...args: unknown[]) => void, ...args: unknown[]) => setTimeout(fn, 0, ...args);

/** stream.Stream, which sax extends; the app never streams XML */
export function Stream() {}

/** string_decoder.StringDecoder, which sax uses only when streaming */
export class StringDecoder {
  constructor() {
    throw new Error('No string_decoder in the browser');
  }
}

/** fs.readFileSync, which cql-exec-fhir calls only for a model info given as a file path */
export function readFileSync(): never {
  throw new Error('No file system in the browser');
}

export default { setImmediate, Stream, StringDecoder, readFileSync };
