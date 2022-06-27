import {
  HMSReactiveStore,
  selectIsConnectedToRoom,
  selectLocalPeer,
  selectRemotePeers,
} from '../../packages/hms-video-store/src';
import { HMSSDKActions } from '../../packages/hms-video-store/src/core/hmsSDKStore/HMSSDKActions';
import { IHMSStoreReadOnly } from '../../packages/hms-video-store/src/core/IHMSStore';
import { CypressPeer } from '../support/peer';
import { CypressRoom } from '../support/room';

let HMSStore, HMSStore1;
let actions: HMSSDKActions;
let actions1: HMSSDKActions;
let store: IHMSStoreReadOnly;
let store1: IHMSStoreReadOnly;
let room: CypressRoom;
let localPeer: CypressPeer;
let remotePeer: CypressPeer;
let initEndpoint;

let token;

const onceCyJoined = store => {
  return cy.wrap(null).should(() => {
    expect(store.getState(selectIsConnectedToRoom)).to.equal(true);
  });
};

const verifyTrackUndefined = ({ actions, store, isLocal = true, trackType }) => {
  const getTrackId = () => {
    const storePeer = isLocal ? store.getState(selectLocalPeer) : store.getState(selectRemotePeers)[0];
    return storePeer[trackType];
  };
  return cy
    .wrap(null)
    .should(() => {
      expect(getTrackId()).to.equal(undefined);
    })
    .then(() => {
      const sdkPeer = isLocal ? actions.sdk.getLocalPeer() : actions.sdk.getPeers().find(peer => !peer.isLocal);
      expect(sdkPeer[trackType]).to.equal(undefined);
    });
};

const verifyRoleChange = ({ actions, store, isLocal = true, role }) => {
  return cy
    .wrap(null)
    .should(() => {
      const storePeer = isLocal ? store.getState(selectLocalPeer) : store.getState(selectRemotePeers)[0];
      expect(storePeer?.roleName).to.equal(role);
    })
    .then(() => {
      const sdkPeer = isLocal ? actions.sdk.getLocalPeer() : actions.sdk.getPeers().find(peer => !peer.isLocal);
      expect(sdkPeer.role.name).to.equal(role);
    });
};

const onBothPeerJoined = (store, store1) => {
  return onceCyJoined(store).should(() => {
    expect(store1.getState(selectIsConnectedToRoom)).to.equal(true);
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
    localPeer = new CypressPeer(token);
    remotePeer = new CypressPeer(token);
    room = new CypressRoom(localPeer, remotePeer);
    initEndpoint = Cypress.env('CYPRESS_INIT_ENDPOINT');
  });

  afterEach(() => {
    if (actions) {
      actions.leave();
    }
    if (actions1) {
      actions1.leave();
    }
    if (room) {
      room.leaveAll();
    }
  });

  it('should join both peers', () => {
    const start = Date.now();
    cy.wrap(room.joinAll()).then(() => {
      expect(localPeer.isConnected()).to.equal(true);
      expect(remotePeer.isConnected()).to.equal(true);
      cy.log('time for both peer join', String(Date.now() - start));
    });
  });

  describe('self role change to non publishing role', () => {
    it('should remove tracks on localPeer', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      onceCyJoined(store).then(() => {
        const localPeer = store.getState(selectLocalPeer);
        actions.changeRole(localPeer.id, 'hls-viewer', true);
        verifyRoleChange({ actions, store, role: 'hls-viewer' }).then(() => {
          verifyTrackUndefined({ actions, store, trackType: 'videoTrack' });
          verifyTrackUndefined({ actions, store, trackType: 'audioTrack' });
        });
      });
    });

    it('should remove tracks on remote end', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      actions1.join({ userName: 'test1', authToken: token, initEndpoint });
      onceCyJoined(store).then(() => {
        const localPeer = store.getState(selectLocalPeer);
        actions.changeRole(localPeer.id, 'hls-viewer', true);
        verifyRoleChange({ actions: actions1, store: store1, role: 'hls-viewer', isLocal: false }).then(() => {
          verifyTrackUndefined({ actions: actions1, store: store1, trackType: 'videoTrack', isLocal: false });
          verifyTrackUndefined({ actions: actions1, store: store1, trackType: 'audioTrack', isLocal: false });
        });
      });
    });
  });

  describe('self role change to audio only role', () => {
    it('should remove video track on localPeer', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      onceCyJoined(store).then(() => {
        const localPeer = store.getState(selectLocalPeer);
        actions.changeRole(localPeer.id, 'audio-only', true);
        verifyRoleChange({ actions, store, role: 'audio-only' });
        verifyTrackUndefined({ actions, store, trackType: 'videoTrack' });
      });
    });
    it('should remove videoTrack on remote end', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      actions1.join({ userName: 'test1', authToken: token, initEndpoint });
      onBothPeerJoined(store, store1)
        // By this time both peers would have joined and got each others tracks
        .then(() => {
          const localPeer = store.getState(selectLocalPeer);
          actions.changeRole(localPeer.id, 'audio-only', true);
          verifyRoleChange({ actions: actions1, store: store1, role: 'audio-only', isLocal: false });
          verifyTrackUndefined({ actions: actions1, store: store1, trackType: 'videoTrack', isLocal: false });
        });
    });
  });

  describe('role change to non publishing role', () => {
    it('should remove tracks on localPeer', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      actions1.join({ userName: 'test1', authToken: token, initEndpoint });
      onBothPeerJoined(store, store1).then(() => {
        const localPeer = store.getState(selectLocalPeer);
        actions1.changeRole(localPeer.id, 'hls-viewer', true);
        verifyRoleChange({ actions, store, role: 'hls-viewer' });
        verifyTrackUndefined({ actions, store, trackType: 'videoTrack' });
        verifyTrackUndefined({ actions, store, trackType: 'audioTrack' });
      });
    });

    it('should remove tracks on remote end', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      actions1.join({ userName: 'test1', authToken: token, initEndpoint });
      onBothPeerJoined(store, store1)
        // By this time both peers would have joined and got each others tracks
        .then(() => {
          const localPeer = store.getState(selectLocalPeer);
          actions1.changeRole(localPeer.id, 'hls-viewer', true);
          verifyRoleChange({ actions: actions1, store: store1, role: 'hls-viewer', isLocal: false });
          verifyTrackUndefined({ actions: actions1, store: store1, trackType: 'videoTrack', isLocal: false });
          verifyTrackUndefined({ actions: actions1, store: store1, trackType: 'audioTrack', isLocal: false });
        });
    });
  });

  describe('role change to audio only role', () => {
    it('should remove video track on localPeer', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      actions1.join({ userName: 'test1', authToken: token, initEndpoint });
      onBothPeerJoined(store, store1).then(() => {
        const localPeer = store.getState(selectLocalPeer);
        actions1.changeRole(localPeer.id, 'audio-only', true);
        verifyRoleChange({ actions, store, role: 'audio-only' });
        verifyTrackUndefined({ actions, store, trackType: 'videoTrack' });
      });
    });
    it('should remove videoTrack on remote end', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      actions1.join({ userName: 'test1', authToken: token, initEndpoint });
      onBothPeerJoined(store, store1)
        // By this time both peers would have joined and got each others tracks
        .then(() => {
          const localPeer = store.getState(selectLocalPeer);
          actions1.changeRole(localPeer.id, 'audio-only', true);
          verifyRoleChange({ actions: actions1, store: store1, role: 'audio-only', isLocal: false });
          verifyTrackUndefined({ actions: actions1, store: store1, trackType: 'videoTrack', isLocal: false });
        });
    });
  });

  describe('role change to audio only role and back to audio video publishing role', () => {
    it('adds new tracks in the existing stream', () => {
      cy.wrap(localPeer.join()).then(() => {
        const sdkPeer = localPeer.sdkPeer;
        const streamId = sdkPeer.audioTrack.stream.id;
        expect(sdkPeer.videoTrack.stream.id).to.equal(streamId);
        cy.wrap(localPeer.changeRole('audio-only')).then(() => {
          expect(localPeer.getVideoTrackId()).to.equal(undefined);
          expect(sdkPeer.videoTrack).to.equal(undefined);
          cy.wrap(localPeer.changeRole('student')).then(() => {
            expect(localPeer.getVideoTrackId()).to.not.equal(undefined);
            expect(sdkPeer.videoTrack.stream.id).to.equal(streamId);
          });
        });
      });
    });
  });
});
