// env.d.ts
/// <reference types="vite/client" />

// Declare your define-injected globals here:
declare const __API_URL__: string;
declare const __APP_ENV__: string;

// Optionally augment ImportMeta.env if you still use import.meta.env:
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_APP_JACKETT_API_URL: string;
  readonly VITE_JACKETT_API_KEY: string;
  // other VITE_* variables…
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
