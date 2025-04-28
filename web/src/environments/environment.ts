export const environment = {
  production: import.meta.env['NG_APP_PRODUCTION'],
  version: import.meta.env['NG_APP_VERSION'],
  host: import.meta.env['NG_APP_HOST'],
  apiUrl: `${import.meta.env['NG_APP_API_HOST']}/api`,
};
