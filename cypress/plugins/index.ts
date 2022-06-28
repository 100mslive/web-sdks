/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
const cwd = process.cwd();
const envPath = cwd.endsWith('web-sdks') ? 'cypress/.env' : '.env';
require('dotenv').config({ path: envPath });
const keys = ['CYPRESS_TOKEN_ENDPOINT', 'CYPRESS_ROOM_ID', 'CYPRESS_ROLE', 'CYPRESS_API_ENV', 'CYPRESS_INIT_ENDPOINT'];
/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  keys.forEach(key => {
    config.env[key] = process.env[key];
  });
  console.log('config', config.env);
  return config;
};
