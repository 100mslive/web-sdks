import {
  HMSReactiveStore,
  selectIsConnectedToRoom,
  selectLocalPeer,
  selectRemotePeers,
} from '../../packages/hms-video-store/src';
import { HMSSDKActions } from '../../packages/hms-video-store/src/core/hmsSDKStore/HMSSDKActions';
import { HMSPeerUpdate, HMSTrackUpdate } from '../../packages/hms-video-store/src/core/hmsSDKStore/sdkTypes';
import { IHMSStoreReadOnly } from '../../packages/hms-video-store/src/core/IHMSStore';

let HMSStore, HMSStore1;
let actions: HMSSDKActions;
let actions1: HMSSDKActions;
let store: IHMSStoreReadOnly;
let store1: IHMSStoreReadOnly;
let initEndpoint;

let token;

const checkTrack = ({ actions, store, isLocal = true, testKey }) => {
  cy.get(isLocal ? '@onTrackUpdate' : '@onTrackUpdate1')
    .should('be.calledWithMatch', HMSTrackUpdate.TRACK_REMOVED)
    .then(() => {
      const sdkPeer = isLocal ? actions.sdk.getLocalPeer() : actions.sdk.getPeers().find(peer => !peer.isLocal);
      const storePeer = isLocal ? store.getState(selectLocalPeer) : store.getState(selectRemotePeers)[0];
      expect(storePeer[testKey]).to.equal(undefined);
      expect(sdkPeer[testKey]).to.equal(undefined);
    });
};

const checkRole = ({ actions, store, isLocal = true, role }) => {
  cy.get(isLocal ? '@onPeerUpdate' : '@onPeerUpdate1')
    .should('be.calledWithMatch', HMSPeerUpdate.ROLE_UPDATED)
    .then(() => {
      const sdkPeer = isLocal ? actions.sdk.getLocalPeer() : actions.sdk.getPeers().find(peer => !peer.isLocal);
      const storePeer = isLocal ? store.getState(selectLocalPeer) : store.getState(selectRemotePeers)[0];
      expect(storePeer.roleName).to.equal(role);
      expect(sdkPeer.role.name).to.equal(role);
    });
};

describe('role change api', () => {
  before(() => {
    cy.getToken().then(authToken => {
      token = authToken;
    });
  });

  beforeEach(() => {
    HMSStore = new HMSReactiveStore();
    actions = HMSStore.getActions();
    store = HMSStore.getStore();
    HMSStore1 = new HMSReactiveStore();
    store1 = HMSStore1.getStore();
    actions1 = HMSStore1.getActions();
    initEndpoint = Cypress.env('CYPRESS_INIT_ENDPOINT');
    //@ts-ignore
    cy.spy(actions, 'onJoin').as('onJoin');
    //@ts-ignore
    cy.spy(actions, 'onTrackUpdate').as('onTrackUpdate');
    //@ts-ignore
    cy.spy(actions, 'onPeerUpdate').as('onPeerUpdate');
    //@ts-ignore
    cy.spy(actions1, 'onJoin').as('onJoin1');
    //@ts-ignore
    cy.spy(actions1, 'onTrackUpdate').as('onTrackUpdate1');
    //@ts-ignore
    cy.spy(actions1, 'onPeerUpdate').as('onPeerUpdate1');
  });

  afterEach(() => {
    if (actions) {
      actions.leave();
    }
    if (actions1) {
      actions1.leave();
    }
  });

  it('both peers should join', () => {
    const start = Date.now();
    actions.join({ userName: 'test', authToken: token, initEndpoint });
    cy.get('@onJoin')
      .should('be.calledOnce')
      .then(() => {
        expect(store.getState(selectIsConnectedToRoom)).to.equal(true);
        cy.log(String(Date.now() - start));
      });

    actions1.join({ userName: 'test1', authToken: token, initEndpoint });
    cy.get('@onJoin1')
      .should('be.calledOnce')
      .then(() => {
        expect(store1.getState(selectIsConnectedToRoom)).to.equal(true);
        cy.log(String(Date.now() - start));
      });
  });

  describe('self role change to non publishing role', () => {
    it('should remove tracks on localPeer', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });

      cy.get('@onTrackUpdate')
        .should('be.calledTwice')
        .then(() => {
          const localPeer = store.getState(selectLocalPeer);
          actions.changeRole(localPeer.id, 'hls-viewer', true);
          checkRole({ actions, store, role: 'hls-viewer' });
          checkTrack({ actions, store, testKey: 'videoTrack' });
          checkTrack({ actions, store, testKey: 'audioTrack' });
        });
    });

    it('should remove tracks on remote end', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      actions1.join({ userName: 'test1', authToken: token, initEndpoint });
      cy.get('@onTrackUpdate')
        .should('have.callCount', 4)
        .then(() => {
          return cy.get('@onTrackUpdate1').should('have.callCount', 4);
        })
        // By this time both peers would have joined and got each others tracks
        .then(() => {
          const localPeer = store.getState(selectLocalPeer);
          actions.changeRole(localPeer.id, 'hls-viewer', true);
          checkRole({ actions: actions1, store: store1, role: 'hls-viewer', isLocal: false });
          checkTrack({ actions: actions1, store: store1, testKey: 'videoTrack', isLocal: false });
          checkTrack({ actions: actions1, store: store1, testKey: 'audioTrack', isLocal: false });
        });
    });
  });

  describe('self role change to audio only role', () => {
    it('should remove video track on localPeer', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      cy.get('@onTrackUpdate')
        .should('be.calledTwice')
        .then(() => {
          const localPeer = store.getState(selectLocalPeer);
          actions.changeRole(localPeer.id, 'audio-only', true);
          checkRole({ actions, store, role: 'audio-only' });
          checkTrack({ actions, store, testKey: 'videoTrack' });
        });
    });
    it('should remove videoTrack on remote end', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      actions1.join({ userName: 'test1', authToken: token, initEndpoint });
      cy.get('@onTrackUpdate')
        .should('have.callCount', 4)
        .then(() => {
          return cy.get('@onTrackUpdate1').should('have.callCount', 4);
        })
        // By this time both peers would have joined and got each others tracks
        .then(() => {
          const localPeer = store.getState(selectLocalPeer);
          actions.changeRole(localPeer.id, 'audio-only', true);
          checkRole({ actions: actions1, store: store1, role: 'audio-only', isLocal: false });
          checkTrack({ actions: actions1, store: store1, testKey: 'videoTrack', isLocal: false });
        });
    });
  });

  describe('role change to non publishing role', () => {
    it('should remove tracks on localPeer', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      actions1.join({ userName: 'test1', authToken: token, initEndpoint });
      cy.get('@onTrackUpdate')
        .should('have.callCount', 4)
        .then(() => {
          return cy.get('@onTrackUpdate1').should('have.callCount', 4);
        })
        .then(() => {
          const localPeer = store.getState(selectLocalPeer);
          actions1.changeRole(localPeer.id, 'hls-viewer', true);
          checkRole({ actions, store, role: 'hls-viewer' });
          checkTrack({ actions, store, testKey: 'videoTrack' });
          checkTrack({ actions, store, testKey: 'audioTrack' });
        });
    });

    it('should remove tracks on remote end', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      actions1.join({ userName: 'test1', authToken: token, initEndpoint });
      cy.get('@onTrackUpdate')
        .should('have.callCount', 4)
        .then(() => {
          return cy.get('@onTrackUpdate1').should('have.callCount', 4);
        })
        // By this time both peers would have joined and got each others tracks
        .then(() => {
          const localPeer = store.getState(selectLocalPeer);
          actions1.changeRole(localPeer.id, 'hls-viewer', true);
          checkRole({ actions: actions1, store: store1, role: 'hls-viewer', isLocal: false });
          checkTrack({ actions: actions1, store: store1, testKey: 'videoTrack', isLocal: false });
          checkTrack({ actions: actions1, store: store1, testKey: 'audioTrack', isLocal: false });
        });
    });
  });

  describe('role change to audio only role', () => {
    it('should remove video track on localPeer', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      actions1.join({ userName: 'test1', authToken: token, initEndpoint });
      cy.get('@onTrackUpdate')
        .should('have.callCount', 4)
        .then(() => {
          return cy.get('@onTrackUpdate1').should('have.callCount', 4);
        })
        .then(() => {
          const localPeer = store.getState(selectLocalPeer);
          actions1.changeRole(localPeer.id, 'audio-only', true);
          checkRole({ actions, store, role: 'audio-only' });
          checkTrack({ actions, store, testKey: 'videoTrack' });
        });
    });
    it('should remove videoTrack on remote end', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      actions1.join({ userName: 'test1', authToken: token, initEndpoint });
      cy.get('@onTrackUpdate')
        .should('have.callCount', 4)
        .then(() => {
          return cy.get('@onTrackUpdate1').should('have.callCount', 4);
        })
        // By this time both peers would have joined and got each others tracks
        .then(() => {
          const localPeer = store.getState(selectLocalPeer);
          actions1.changeRole(localPeer.id, 'audio-only', true);
          checkRole({ actions: actions1, store: store1, role: 'audio-only', isLocal: false });
          checkTrack({ actions: actions1, store: store1, testKey: 'videoTrack', isLocal: false });
        });
    });
  });
});
