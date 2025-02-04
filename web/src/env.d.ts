declare interface Env {
  readonly NODE_ENV: string;
  // Replace the following with your own environment variables, for example:
  // readonly NG_APP_VERSION: string;
  [key: string]: any;
}

declare interface ImportMeta {
  readonly env: Env;
}
