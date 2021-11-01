/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Get token required for preview/join
     * @param title
     */
    getToken(): Chainable<string>;
  }
}
