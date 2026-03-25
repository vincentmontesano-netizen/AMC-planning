/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AMS_BASE_URL?: string;
  readonly VITE_AMS_API_VER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
