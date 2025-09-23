/// <reference types="vite/client" />
/// <reference types="unplugin-icons/types/react" />
declare module '*.jsx' {
  const component: React.ComponentType<any>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
