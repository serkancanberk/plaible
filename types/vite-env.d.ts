/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly DEV: boolean
    readonly PROD: boolean
    readonly MODE: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

export {}
