/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_ENDPOINT: string;
  readonly VITE_WEBSOCKET_ENDPOINT: string;
  readonly VITE_AWS_REGION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 