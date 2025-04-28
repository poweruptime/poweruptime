export const environment = {
  production: true,
  version: require('../../package.json').version,
  host: import.meta.env["NG_APP_HOST"],
  apiUrl: `${import.meta.env["NG_APP_API_HOST"]}/api`,
};
