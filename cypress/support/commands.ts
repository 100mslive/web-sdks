/// <reference types="cypress" />

import { SinonSpy, SinonSpyCall } from 'cypress/types/sinon';
import type { HMSLocalPeer } from '../../packages/hms-video-store/src/core/hmsSDKStore/sdkTypes';

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

Cypress.Commands.add('getToken', (role?: string) => {
  let tokenEndpoint = Cypress.env('CYPRESS_TOKEN_ENDPOINT');
  if (!tokenEndpoint) {
    throw new Error('cypress token endpoint is not configured');
  }
  if (!tokenEndpoint.endsWith('api/token')) {
    if (!tokenEndpoint.endsWith('/')) {
      tokenEndpoint += '/';
    }
    tokenEndpoint += 'api/token';
  }
  const data = {
    room_id: Cypress.env('CYPRESS_ROOM_ID'),
    role: role || Cypress.env('CYPRESS_ROLE'),
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

Cypress.Commands.add(
  'localTracksAdded',
  (localPeer: HMSLocalPeer, { join = '@onJoin', trackUpdate = '@onTrackUpdate' } = {}) => {
    return cy
      .get(join)
      .then(() => cy.get(trackUpdate))
      .should(value => {
        const spy = value as unknown as SinonSpy;
        let count = 0;
        console.log(spy);
        spy.getCalls().forEach((call: SinonSpyCall) => {
          if (expect(call.lastArg).to.equal(localPeer)) {
            count++;
          }
        });
        expect(count).to.equal(2);
      })
      .then(() => {
        return Promise.resolve();
      });
  },
);
