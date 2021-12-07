/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<> {
    /**
     * Get token required for preview/join
     * @param title
     */
    getToken(): Chainable<string>;
  }
}
