export const goOffline = () => {
  cy.log('**go offline**')
    .then(() => {
      return Cypress.automation('remote:debugger:protocol', {
        command: 'Network.enable',
      });
    })
    .then(() => {
      return Cypress.Promise.race([
        cy.wait(1500),
        Cypress.automation('remote:debugger:protocol', {
          command: 'Network.emulateNetworkConditions',
          params: {
            offline: true,
            latency: -1,
            downloadThroughput: -1,
            uploadThroughput: -1,
          },
        }),
      ]);
    });
};

export const goOnline = () => {
  // disable offline mode, otherwise we will break our tests :)
  cy.log('**go online**').then(() => {
    cy.log('**go offline**')
      .then(() => {
        return Cypress.automation('remote:debugger:protocol', {
          command: 'Network.enable',
        });
      })
      .then(() => {
        return Cypress.Promise.race([
          cy.wait(1500),
          Cypress.automation('remote:debugger:protocol', {
            command: 'Network.emulateNetworkConditions',
            params: {
              offline: false,
              latency: -1,
              downloadThroughput: -1,
              uploadThroughput: -1,
            },
          }),
        ]);
      });
  });
};
