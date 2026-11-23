/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The store the app starts on: public (the HAPI sandbox), browser, or custom (VITE_FHIR_BASE). */
  readonly VITE_BACKEND?: string;
  /** VITE_MOCK=1: start on the in-browser store, as VITE_BACKEND=browser. */
  readonly VITE_MOCK?: string;
  /** The FHIR base of the custom server the app starts on; default /fhir (the local HAPI, proxied). */
  readonly VITE_FHIR_BASE?: string;
}
