import { CypressPeer } from '../support/peer';
import { HTTPAnalyticsTransport } from '../../packages/hms-video-web/src/analytics/HTTPAnalyticsTransport';
import { CLIENT_ANAYLTICS_QA_ENDPOINT } from '../../packages/hms-video-web/src/utils/constants';
import AnalyticsEventFactory from '../../packages/hms-video-web/src/analytics/AnalyticsEventFactory';
import { ErrorFactory, HMSAction } from '../../packages/hms-video-web/src/error/ErrorFactory';

let token: string;
let invalidRoleToken: string;
let localPeer: CypressPeer;
const TAG = '[http-analytics-spec]';

const logError = (...args) => console.error(TAG, ...args);

describe('Http Analytics tests', () => {
  before(() => {
    cy.getToken().then(authToken => {
      token = authToken;
    });
    cy.getToken('test').then(authToken => {
      invalidRoleToken = authToken;
    });
  });
  beforeEach(() => {
    cy.spy(HTTPAnalyticsTransport, 'sendEvent').as('sendEvent');
    cy.spy(HTTPAnalyticsTransport, 'setEnv').as('setEnv');
    //@ts-ignore
    cy.spy(HTTPAnalyticsTransport, 'addEventToStorage').as('addEventToStorage');
  });

  it('should not call http analytics with valid role token', () => {
    localPeer = new CypressPeer(token);
    localPeer.preview().then(() => {
      cy.get('@setEnv').should('be.calledOnce');
      cy.get('@sendEvent').should('not.be.called');
    });
  });

  it('should call http analytics with invalid role token', () => {
    cy.intercept(
      { url: CLIENT_ANAYLTICS_QA_ENDPOINT, method: 'POST' },
      { statusCode: 200, statusText: 'Event recorded' },
    );
    //@ts-ignore
    window.HMS = { CLIENT_EVENTS: true };
    localPeer = new CypressPeer(invalidRoleToken);
    localPeer
      .preview()
      .catch(logError)
      .then(() => {
        cy.get('@onError').should('be.calledOnce');
        cy.get('@setEnv').should('be.calledOnce');
        // sendEvent for connect and preview
        cy.get('@sendEvent').should('be.calledTwice');
        cy.get('@addEventToStorage').should('not.be.called');
      });
  });

  it('should store in storage if analytics fails and send again on preview', () => {
    cy.intercept(
      { url: CLIENT_ANAYLTICS_QA_ENDPOINT, method: 'POST' },
      { statusCode: 500, statusText: 'Something went wrong' },
    );
    localPeer = new CypressPeer(invalidRoleToken);
    localPeer
      .preview()
      .catch(logError)
      .then(() => {
        cy.get('@onError').should('be.calledOnce');
        cy.get('@setEnv').should('be.calledOnce');
        cy.get('@sendEvent').should('be.calledTwice');
        cy.get('@addEventToStorage')
          .should('be.calledTwice')
          .then(() => {
            expect(localStorage.getItem('client-events')).to.not.equal(null);
            const remotePeer = new CypressPeer(token);
            cy.intercept(
              { url: CLIENT_ANAYLTICS_QA_ENDPOINT, method: 'POST' },
              { statusCode: 200, statusText: 'Event recorded' },
            );
            remotePeer.preview().then(() => {
              // 2 for new sdk connect/preview success, 2 from storage for old sdk
              cy.get('@sendEvent').should('have.callCount', 4);
            });
          });
      });
  });

  it('should send previous local storage events on join', () => {
    cy.intercept(
      { url: CLIENT_ANAYLTICS_QA_ENDPOINT, method: 'POST' },
      { statusCode: 200, statusText: 'Event recorded' },
    );
    const event = AnalyticsEventFactory.connect(ErrorFactory.InitAPIErrors.InitConfigNotAvailable(HMSAction.INIT));
    event.properties.token = token;
    localStorage.setItem('client-events', JSON.stringify([event]));
    localPeer = new CypressPeer(token);
    localPeer.join().then(() => {
      cy.get('@sendEvent').should('be.calledOnce');
    });
  });
});
