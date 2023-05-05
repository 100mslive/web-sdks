import { CypressPeer } from '../support/peer';
import { CypressRoom } from '../support/room';

let localPeer: CypressPeer;
let remotePeer: CypressPeer;
let room: CypressRoom;

let token;

describe('role change api', () => {
  before(() => {
    cy.getToken().then(authToken => {
      token = authToken;
    });
  });

  beforeEach(() => {
    localPeer = new CypressPeer(token);
    remotePeer = new CypressPeer(token);
    room = new CypressRoom(localPeer, remotePeer);
  });

  afterEach(() => {
    if (room) {
      room.leaveAll();
    }
  });

  it('should join both peers', () => {
    const start = Date.now();
    cy.wrap(room.joinAll()).then(() => {
      expect(localPeer.isConnected()).to.be.true;
      expect(remotePeer.isConnected()).to.be.true;
      expectLocalAVExistence(true, true);
      cy.log('time for both peer join', String(Date.now() - start));
    });
  });

  describe('self role change to non publishing role', () => {
    it('should remove tracks on localPeer and for remote', () => {
      cy.wrap(room.joinAll()).then(() => {
        expectLocalAVExistence(true, true);
        verifySelfRoleChange('hls-viewer', { audio: false, video: false });
      });
    });
  });

  describe('self role change to audio only role', () => {
    it('should remove only the video track', () => {
      cy.wrap(room.joinAll()).then(() => {
        expectLocalAVExistence(true, true);
        verifySelfRoleChange('audio-only', { audio: true, video: false });
      });
    });
  });

  describe('remote role change to non publishing role', () => {
    it('should remove tracks for localPeer and remotePeer', () => {
      cy.wrap(room.joinAll()).then(() => {
        expectLocalAVExistence(true, true);
        verifyRemoteRoleChange('hls-viewer', { audio: false, video: false });
      });
    });
  });

  describe('remote role change to audio only role', () => {
    it('should remove video track on localPeer and on remote end', () => {
      cy.wrap(room.joinAll()).then(() => {
        expectLocalAVExistence(true, true);
        verifyRemoteRoleChange('audio-only', { audio: true, video: false });
      });
    });
  });

  describe('multiple roles changes, mix of remote and self', () => {
    it('should handle publishing both=>non-publishing=>audio-only', () => {
      cy.wrap(room.joinAll()).then(() => {
        expectLocalAVExistence(true, true);
        verifySelfRoleChange('hls-viewer', { audio: false, video: false }).then(() => {
          verifyRemoteRoleChange('audio-only', { audio: true, video: false });
        });
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
          expect(localPeer.videoTrack).to.be.undefined;
          expect(sdkPeer.videoTrack).to.be.undefined;
          cy.wrap(localPeer.changeRole('student')).then(() => {
            expect(localPeer.videoTrack).to.exist;
            expect(sdkPeer.videoTrack.stream.id).to.equal(streamId);
          });
        });
      });
    });
  });
});

function verifySelfRoleChange(toRole: string, roleAv: { audio: boolean; video: boolean }) {
  return cy.wrap(localPeer.changeRole(toRole)).then(() => {
    cy.log('selfRoleChange - ', toRole);
    cy.wrap(remotePeer.waitTillRoleChange(toRole, localPeer.id)).then(() => {
      cy.wrap(remotePeer.waitForTracks(localPeer.id)).then(() => {
        expectLocalAVExistence(roleAv.audio, roleAv.video);
      });
    });
  });
}

function verifyRemoteRoleChange(toRole: string, roleAv: { audio: boolean; video: boolean }) {
  return cy.wrap(remotePeer.changeRole(toRole, localPeer.id)).then(() => {
    cy.log('remoteRoleChange - ', toRole);
    cy.wrap(localPeer.waitTillRoleChange(toRole)).then(() => {
      cy.wrap(remotePeer.waitForTracks(localPeer.id)).then(() => {
        expectLocalAVExistence(roleAv.audio, roleAv.video);
      });
    });
  });
}

function expectLocalAVExistence(audio: boolean, video: boolean) {
  const localPeerInRemote = remotePeer.getPeerById(localPeer.id);
  if (audio) {
    expect(localPeer.audioTrack).to.exist;
    expect(localPeerInRemote.audioTrack).to.exist;
  } else {
    expect(localPeer.audioTrack).to.be.undefined;
    expect(localPeerInRemote.audioTrack).to.be.undefined;
  }
  if (video) {
    expect(localPeer.videoTrack).to.exist;
    expect(localPeerInRemote.videoTrack).to.exist;
  } else {
    expect(localPeer.videoTrack).to.be.undefined;
    expect(localPeerInRemote.videoTrack).to.be.undefined;
  }
}
