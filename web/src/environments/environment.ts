export const environment = {
  production: false,
  version: 'DEV',
  host: import.meta.env["NG_APP_HOST"],
  apiUrl: `${import.meta.env["NG_APP_API_HOST"]}/api`,
};
