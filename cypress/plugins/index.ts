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
require('dotenv').config();

const keys = ['CYPRESS_TOKEN_ENDPOINT', 'CYPRESS_ROOM_ID', 'CYPRESS_ROLE', 'CYPRESS_API_ENV', 'CYPRESS_INIT_ENDPOINT'];
/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  on('before:browser:launch', (browser = {}, launchOptions) => {
    // `args` is an array of all the arguments that will
    // be passed to browsers when it launches
    console.log(launchOptions.args); // print all current args
    //@ts-ignore
    if (browser.family === 'chromium' && browser.name !== 'electron') {
      // auto open devtools
      launchOptions.args.push('--auto-open-devtools-for-tabs');
    }
    //@ts-ignore
    if (browser.family === 'firefox') {
      // auto open devtools
      launchOptions.args.push('-devtools');
    }
    //@ts-ignore
    if (browser.name === 'electron') {
      // auto open devtools
      launchOptions.preferences.devTools = true;
    }
    // whatever you return here becomes the launchOptions
    return launchOptions;
  });
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  keys.forEach(key => {
    config.env[key] = process.env[key];
  });
  require('@cypress/code-coverage/task')(on, config);
  return config;
};
