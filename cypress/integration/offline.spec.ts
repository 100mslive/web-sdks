import { HMSReactiveStore, selectIsLocalScreenShared } from '../../packages/hms-video-store/src';
import { HMSSDKActions } from '../../packages/hms-video-store/src/core/hmsSDKStore/HMSSDKActions';
import { IHMSStoreReadOnly } from '../../packages/hms-video-store/src/core/IHMSStore';
import { goOffline, goOnline } from '../utils';

let HMSStore;
let actions: HMSSDKActions;
let store: IHMSStoreReadOnly;
let initEndpoint;

let token;

describe('check track remove online/offline', () => {
  before(() => {
    cy.getToken().then(authToken => {
      token = authToken;
    });
  });
  beforeEach(() => {
    HMSStore = new HMSReactiveStore();
    actions = HMSStore.getHMSActions();
    store = HMSStore.getStore();
    actions.setLogLevel(4);
    initEndpoint = Cypress.env('CYPRESS_INIT_ENDPOINT');
    //@ts-ignore
    cy.spy(actions, 'onTrackUpdate').as('onTrackUpdate');
    cy.window().then(window => {
      const online = cy.stub().as('online');
      const offline = cy.stub().as('offline');
      window.addEventListener('online', online);
      window.addEventListener('offline', offline);
    });
  });

  afterEach(() => {
    if (actions) {
      return actions.leave();
    }
  });

  it('should update track when removed in offline state', { defaultCommandTimeout: 10000 }, () => {
    actions.join({ userName: 'test', authToken: token, initEndpoint });
    cy.get('@onTrackUpdate')
      .should('be.calledTwice')
      .then(() => {
        return actions.setScreenShareEnabled(true);
      })
      .then(() => {
        const value = store.getState(selectIsLocalScreenShared);
        expect(value).to.be.true;
        goOffline();
        cy.get('@offline').then(() => {
          actions.setScreenShareEnabled(false).then(() => {
            const value = store.getState(selectIsLocalScreenShared);
            expect(value).to.be.false;
          });
          goOnline();
          cy.get('@online').then(() => {
            console.log('online called');
          });
        });
      });
  });
});
