/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SOCKET_URL: string;
  readonly VITE_VAPID_KEY: string;
  readonly VITE_OPENWEATHER_API_KEY: string;
  readonly VITE_BOOKIT_TV_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
