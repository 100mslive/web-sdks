/// <reference types="cypress" />
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('getToken', () => {
  const tokenEndpoint = Cypress.env('CYPRESS_TOKEN_ENDPOINT');
  const data = {
    room_id: Cypress.env('CYPRESS_ROOM_ID'),
    role: Cypress.env('CYPRESS_ROLE'),
    env: Cypress.env('CYPRESS_API_ENV'),
    user_id: 'test',
  };
  return cy
    .request('POST', tokenEndpoint, data)
    .then(response => {
      return response.body.token;
    })
    .should('exist');
});
