import { HMSAction } from '@100mslive/hms-video-store/src/error/HMSAction';
import { HMSUpdateListener } from '@100mslive/hms-video-store/src/internal';
import AnalyticsEventFactory from '../../packages/hms-video-store/src/analytics/AnalyticsEventFactory';
import { HTTPAnalyticsTransport } from '../../packages/hms-video-store/src/analytics/HTTPAnalyticsTransport';
import { ErrorFactory } from '../../packages/hms-video-store/src/error/ErrorFactory';
import { HMSPreviewListener } from '../../packages/hms-video-store/src/interfaces/preview-listener';
import { HMSSdk } from '../../packages/hms-video-store/src/sdk';
import { CLIENT_ANAYLTICS_QA_ENDPOINT } from '../../packages/hms-video-store/src/utils/constants';

let sdk: HMSSdk;
let token: string;
let invalidRoleToken: string;
let initEndpoint: string;
let previewListener: HMSPreviewListener;
let joinListener: HMSUpdateListener;

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
    joinListener = {
      onJoin: cy.stub().as('onJoin'),
      onRoomUpdate: cy.stub().as('onJoinRoomUpdate'),
      onPeerUpdate: cy.stub().as('onJoinPeerUpdate'),
      onError: cy.stub().as('onJoinError'),
      onDeviceChange: cy.stub().as('onJoinDeviceChange'),
      onReconnecting: cy.stub().as('onJoinReconnecting'),
      onReconnected: cy.stub().as('onJoinReconnected'),
      onTrackUpdate: cy.stub().as('onTrackUpdate'),
      onMessageReceived: cy.stub().as('onMessageReceived'),
      onRoleChangeRequest: cy.stub().as('onRoleChangeRequest'),
      onRoleUpdate: cy.stub().as('onRoleUpdate'),
      onChangeTrackStateRequest: cy.stub().as('onChangeTrackStateRequest'),
      onChangeMultiTrackStateRequest: cy.stub().as('onChangeMultiTrackStateRequest'),
      onRemovedFromRoom: cy.stub().as('onRemovedFromRoom'),
      onSessionStoreUpdate: cy.stub().as('onSessionStoreUpdate'),
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
    window.HMS = { CLIENT_EVENTS: true };
    //@ts-ignore
    sdk.preview({ userName: 'test', authToken: invalidRoleToken, initEndpoint }, previewListener).catch(console.error);
    cy.get('@onError').should('be.calledOnce');
    cy.get('@setEnv').should('be.calledOnce');
    // sendEvent for connect and preview
    cy.get('@sendEvent').should('be.calledTwice');
    cy.get('@addEventToStorage').should('not.be.called');
  });

  it('should store in storage if analytics fails and send again on preview', () => {
    cy.intercept(
      { url: CLIENT_ANAYLTICS_QA_ENDPOINT, method: 'POST' },
      { statusCode: 500, statusText: 'Something went wrong' },
    );
    //@ts-ignore
    sdk.preview({ userName: 'test', authToken: invalidRoleToken, initEndpoint }, previewListener).catch(console.error);
    cy.get('@onError').should('be.calledOnce');
    cy.get('@setEnv').should('be.calledOnce');
    cy.get('@sendEvent').should('be.calledTwice');
    cy.get('@addEventToStorage')
      .should('be.calledTwice')
      .then(() => {
        expect(localStorage.getItem('client-events')).to.not.equal(null);
        const newSdk = new HMSSdk();
        cy.intercept(
          { url: CLIENT_ANAYLTICS_QA_ENDPOINT, method: 'POST' },
          { statusCode: 200, statusText: 'Event recorded' },
        );
        //@ts-ignore
        newSdk.preview({ userName: 'test', authToken: token, initEndpoint }, previewListener).catch(console.error);
        // 2 for new sdk connect/preview success, 2 from storage for old sdk
        cy.get('@sendEvent').should('have.callCount', 4);
      });
  });

  it('should send previous local storage events on join', () => {
    cy.intercept(
      { url: CLIENT_ANAYLTICS_QA_ENDPOINT, method: 'POST' },
      { statusCode: 200, statusText: 'Event recorded' },
    );
    const event = AnalyticsEventFactory.connect(ErrorFactory.APIErrors.InitConfigNotAvailable(HMSAction.INIT));
    event.properties.token = token;
    localStorage.setItem('client-events', JSON.stringify([event]));
    sdk.join({ userName: 'test', authToken: token, initEndpoint }, joinListener);
    cy.get('@sendEvent').should('be.calledOnce');
  });
});
