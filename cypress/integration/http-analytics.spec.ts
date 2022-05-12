import { HMSSdk } from '../../packages/hms-video-web/src/sdk';
import { HTTPAnalyticsTransport } from '../../packages/hms-video-web/src/analytics/HTTPAnalyticsTransport';
import { HMSPreviewListener } from '../../packages/hms-video-web/src/interfaces/preview-listener';
import { CLIENT_ANAYLTICS_QA_ENDPOINT } from '../../packages/hms-video-web/src/utils/constants';

let sdk: HMSSdk;
let token: string;
let invalidRoleToken: string;
let initEndpoint: string;
let previewListener: HMSPreviewListener;

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
    sdk = new HMSSdk();
    initEndpoint = Cypress.env('CYPRESS_INIT_ENDPOINT');
    previewListener = {
      onPreview: cy.stub().as('onPreview'),
      onRoomUpdate: cy.stub().as('onRoomUpdate'),
      onError: cy.stub().as('onError'),
      onDeviceChange: cy.stub().as('onDeviceChange'),
      onPeerUpdate: cy.stub().as('onPeerUpdate'),
      onReconnecting: cy.stub().as('onReconnecting'),
      onReconnected: cy.stub().as('onReconnected'),
    };
    cy.spy(HTTPAnalyticsTransport, 'sendEvent').as('sendEvent');
    cy.spy(HTTPAnalyticsTransport, 'setEnv').as('setEnv');
    //@ts-ignore
    cy.spy(HTTPAnalyticsTransport, 'addEventToStorage').as('addEventToStorage');
  });

  it('should not call http analytics with valid role token', () => {
    //@ts-ignore
    sdk.preview({ userName: 'test', authToken: token, initEndpoint }, previewListener);
    cy.get('@setEnv').should('be.calledOnce');
    cy.get('@sendEvent').should('not.be.called');
  });

  it('should call http analytics with invalid role token', () => {
    cy.intercept(
      { url: CLIENT_ANAYLTICS_QA_ENDPOINT, method: 'POST' },
      { statusCode: 200, statusText: 'Event recorded' },
    );
    //@ts-ignore
    sdk.preview({ userName: 'test', authToken: invalidRoleToken, initEndpoint }, previewListener).catch(console.error);
    cy.get('@onError').should('be.calledOnce');
    cy.get('@setEnv').should('be.calledOnce');
    cy.get('@sendEvent').should('be.calledOnce');
    cy.get('@addEventToStorage').should('not.be.called');
  });

  it('should store in storage if analytics fails and send again on preview', () => {
    cy.intercept(
      { url: CLIENT_ANAYLTICS_QA_ENDPOINT, method: 'POST' },
      { statusCode: 401, statusText: 'Something went wrong' },
    );
    //@ts-ignore
    sdk.preview({ userName: 'test', authToken: invalidRoleToken, initEndpoint }, previewListener).catch(console.error);
    cy.get('@onError').should('be.calledOnce');
    cy.get('@setEnv').should('be.calledOnce');
    cy.get('@sendEvent').should('be.calledOnce');
    cy.get('@addEventToStorage').then(() => {
      expect(localStorage.getItem('client-events')).to.not.equal(null);
      const newSdk = new HMSSdk();
      cy.intercept(
        { url: CLIENT_ANAYLTICS_QA_ENDPOINT, method: 'POST' },
        { statusCode: 200, statusText: 'Event recorded' },
      );
      //@ts-ignore
      newSdk.preview({ userName: 'test', authToken: token, initEndpoint }, previewListener).catch(console.error);
      cy.get('@sendEvent').should('be.calledTwice');
    });
  });
});
