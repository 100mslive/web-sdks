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
          cy.get('@onPeerUpdate')
            .should('be.calledWithMatch', HMSPeerUpdate.ROLE_UPDATED)
            .then(() => {
              const localPeer = store.getState(selectLocalPeer);
              expect(localPeer.roleName).to.equal('hls-viewer');
            });
          cy.get('@onTrackUpdate')
            .should('be.calledWithMatch', HMSTrackUpdate.TRACK_REMOVED)
            .then(() => {
              //@ts-ignore
              const sdkPeer = actions.sdk.getLocalPeer();
              const localPeer = store.getState(selectLocalPeer);
              expect(localPeer.videoTrack).to.equal(undefined);
              expect(sdkPeer.videoTrack).to.equal(undefined);
            });
          cy.get('@onTrackUpdate')
            .should('be.calledWithMatch', HMSTrackUpdate.TRACK_REMOVED)
            .then(() => {
              //@ts-ignore
              const sdkPeer = actions.sdk.getLocalPeer();
              const localPeer = store.getState(selectLocalPeer);
              expect(localPeer.audioTrack).to.equal(undefined);
              expect(sdkPeer.audioTrack).to.equal(undefined);
            });
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
          cy.get('@onPeerUpdate1')
            .should('be.calledWithMatch', HMSPeerUpdate.ROLE_UPDATED)
            .then(() => {
              const remotePeer = store1.getState(selectRemotePeers)[0];
              expect(remotePeer.roleName).to.equal('hls-viewer');
            });

          cy.get('@onTrackUpdate1')
            .should('be.calledWithMatch', HMSTrackUpdate.TRACK_REMOVED)
            .then(() => {
              //@ts-ignore
              const sdkPeer = actions1.sdk.getPeers().find(peer => !peer.isLocal);
              const remotePeer = store1.getState(selectRemotePeers)[0];
              expect(remotePeer.videoTrack).to.equal(undefined);
              expect(sdkPeer.videoTrack).to.equal(undefined);
            });
          cy.get('@onTrackUpdate1')
            .should('be.calledWithMatch', HMSTrackUpdate.TRACK_REMOVED)
            .then(() => {
              //@ts-ignore
              const sdkPeer = actions1.sdk.getPeers().find(peer => !peer.isLocal);
              const remotePeer = store1.getState(selectRemotePeers)[0];
              expect(remotePeer.audioTrack).to.equal(undefined);
              expect(sdkPeer.audioTrack).to.equal(undefined);
            });
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
          cy.get('@onPeerUpdate')
            .should('be.calledWithMatch', HMSPeerUpdate.ROLE_UPDATED)
            .then(() => {
              const localPeer = store.getState(selectLocalPeer);
              expect(localPeer.roleName).to.equal('audio-only');
            });
          cy.get('@onTrackUpdate')
            .should('be.calledWithMatch', HMSTrackUpdate.TRACK_REMOVED)
            .then(() => {
              //@ts-ignore
              const sdkPeer = actions.sdk.getLocalPeer();
              const localPeer = store.getState(selectLocalPeer);
              expect(localPeer.videoTrack).to.equal(undefined);
              expect(sdkPeer.videoTrack).to.equal(undefined);
              expect(localPeer.audioTrack).to.not.equal(undefined);
              expect(sdkPeer.audioTrack).to.not.equal(undefined);
            });
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
          cy.get('@onPeerUpdate1')
            .should('be.calledWithMatch', HMSPeerUpdate.ROLE_UPDATED)
            .then(() => {
              const remotePeer = store1.getState(selectRemotePeers)[0];
              expect(remotePeer.roleName).to.equal('audio-only');
            });

          cy.get('@onTrackUpdate1')
            .should('be.calledWithMatch', HMSTrackUpdate.TRACK_REMOVED)
            .then(() => {
              //@ts-ignore
              const sdkPeer = actions1.sdk.getPeers().find(peer => !peer.isLocal);
              const remotePeer = store1.getState(selectRemotePeers)[0];
              expect(remotePeer.videoTrack).to.equal(undefined);
              expect(sdkPeer.videoTrack).to.equal(undefined);
              expect(remotePeer.audioTrack).to.not.equal(undefined);
              expect(sdkPeer.audioTrack).to.not.equal(undefined);
            });
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
          cy.get('@onPeerUpdate')
            .should('be.calledWithMatch', HMSPeerUpdate.ROLE_UPDATED)
            .then(() => {
              const localPeer = store.getState(selectLocalPeer);
              expect(localPeer.roleName).to.equal('hls-viewer');
            });
          cy.get('@onTrackUpdate')
            .should('be.calledWithMatch', HMSTrackUpdate.TRACK_REMOVED)
            .then(() => {
              //@ts-ignore
              const sdkPeer = actions.sdk.getLocalPeer();
              const localPeer = store.getState(selectLocalPeer);
              expect(localPeer.videoTrack).to.equal(undefined);
              expect(sdkPeer.videoTrack).to.equal(undefined);
            });
          cy.get('@onTrackUpdate')
            .should('be.calledWithMatch', HMSTrackUpdate.TRACK_REMOVED)
            .then(() => {
              //@ts-ignore
              const sdkPeer = actions.sdk.getLocalPeer();
              const localPeer = store.getState(selectLocalPeer);
              expect(localPeer.audioTrack).to.equal(undefined);
              expect(sdkPeer.audioTrack).to.equal(undefined);
            });
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
          cy.get('@onPeerUpdate1')
            .should('be.calledWithMatch', HMSPeerUpdate.ROLE_UPDATED)
            .then(() => {
              const remotePeer = store1.getState(selectRemotePeers)[0];
              expect(remotePeer.roleName).to.equal('hls-viewer');
            });
          cy.get('@onTrackUpdate1')
            .should('be.calledWithMatch', HMSTrackUpdate.TRACK_REMOVED)
            .then(() => {
              //@ts-ignore
              const sdkPeer = actions1.sdk.getPeers().find(peer => !peer.isLocal);
              const remotePeer = store1.getState(selectRemotePeers)[0];
              expect(remotePeer.videoTrack).to.equal(undefined);
              expect(sdkPeer.videoTrack).to.equal(undefined);
            });
          cy.get('@onTrackUpdate1')
            .should('be.calledWithMatch', HMSTrackUpdate.TRACK_REMOVED)
            .then(() => {
              //@ts-ignore
              const sdkPeer = actions1.sdk.getPeers().find(peer => !peer.isLocal);
              const remotePeer = store1.getState(selectRemotePeers)[0];
              expect(remotePeer.audioTrack).to.equal(undefined);
              expect(sdkPeer.audioTrack).to.equal(undefined);
            });
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
          cy.get('@onPeerUpdate')
            .should('be.calledWithMatch', HMSPeerUpdate.ROLE_UPDATED)
            .then(() => {
              const localPeer = store.getState(selectLocalPeer);
              expect(localPeer.roleName).to.equal('audio-only');
            });
          cy.get('@onTrackUpdate')
            .should('be.calledWithMatch', HMSTrackUpdate.TRACK_REMOVED)
            .then(() => {
              //@ts-ignore
              const sdkPeer = actions.sdk.getLocalPeer();
              const localPeer = store.getState(selectLocalPeer);
              expect(localPeer.videoTrack).to.equal(undefined);
              expect(sdkPeer.videoTrack).to.equal(undefined);
            });
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
          cy.get('@onPeerUpdate1')
            .should('be.calledWithMatch', HMSPeerUpdate.ROLE_UPDATED)
            .then(() => {
              const remotePeer = store1.getState(selectRemotePeers)[0];
              expect(remotePeer.roleName).to.equal('audio-only');
            });
          cy.get('@onTrackUpdate1')
            .should('be.calledWithMatch', HMSTrackUpdate.TRACK_REMOVED)
            .then(() => {
              //@ts-ignore
              const sdkPeer = actions1.sdk.getPeers().find(peer => !peer.isLocal);
              const remotePeer = store1.getState(selectRemotePeers)[0];
              expect(remotePeer.videoTrack).to.equal(undefined);
              expect(sdkPeer.videoTrack).to.equal(undefined);
            });
        });
    });
  });
});
