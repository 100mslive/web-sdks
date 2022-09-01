import { selectTrackByID, selectTracksMap } from '@100mslive/hms-video-store';
import { CypressPeer } from '../support/peer';
import { CypressRoom } from '../support/room';

let token: string;
let localPeer: CypressPeer;
let remotePeer: CypressPeer;
let room: CypressRoom;

const getTrack = () => {
  return navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(stream => {
    return stream.getVideoTracks()[0];
  });
};

const getTrackCountInRoom = (peer: CypressPeer) => Object.keys(peer.store.getState(selectTracksMap)).length;

const expectSameTrackCountAcrossPeers = (count: number) => {
  expect(getTrackCountInRoom(localPeer)).to.equal(count);
  expect(getTrackCountInRoom(remotePeer)).to.equal(count);
};

describe('add/remove track api', () => {
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

  it('both peers should join', () => {
    const start = Date.now();
    cy.wrap(room.joinAll()).then(() => {
      expect(localPeer.isConnected()).to.be.true;
      expect(remotePeer.isConnected()).to.be.true;
      cy.log(String(Date.now() - start));
    });
  });

  it('should add/remove a track to aux track on addTrack for localPeer', () => {
    cy.wrap(localPeer.join()).then(() => {
      cy.wrap(getTrack()).then((videoTrack: MediaStreamTrack) => {
        cy.wrap(localPeer.actions.addTrack(videoTrack, 'regular')).then(() => {
          expect(localPeer.auxiliaryTracks[0]).to.equal(videoTrack.id);
          expect(localPeer.videoTrack).to.not.equal(videoTrack.id);

          cy.wrap(localPeer.actions.removeTrack(videoTrack.id)).then(() => {
            expect(localPeer.auxiliaryTracks.length).to.equal(0);
            expect(localPeer.videoTrack).to.not.equal(undefined);
          });
        });
      });
    });
  });

  it('should add/remove aux track for remotePeer on add/removeTrack', () => {
    cy.wrap(room.joinAll()).then(() => {
      expectSameTrackCountAcrossPeers(4);

      cy.wrap(getTrack()).then((videoTrack: MediaStreamTrack) => {
        cy.wrap(localPeer.actions.addTrack(videoTrack, 'regular')).then(() => {
          cy.wrap(remotePeer.waitForTrack(videoTrack.id)).then(() => {
            expectSameTrackCountAcrossPeers(5);
            const localPeerInRemote = remotePeer.remotePeers[0];
            expect(localPeerInRemote.auxiliaryTracks[0]).to.equal(videoTrack.id);
            expect(localPeerInRemote.videoTrack).to.not.equal(videoTrack.id);

            cy.wrap(localPeer.actions.removeTrack(videoTrack.id)).then(() => {
              cy.wrap(
                new Promise(resolve => {
                  remotePeer.store.subscribe(track => {
                    // resolve when aux track has been removed
                    if (!track) {
                      resolve(true);
                    }
                  }, selectTrackByID(videoTrack.id));
                }),
              ).then(() => {
                expectSameTrackCountAcrossPeers(4);
                const localPeerInRemote = remotePeer.remotePeers[0];
                expect(localPeerInRemote.auxiliaryTracks.length).to.equal(0);
                expect(localPeerInRemote.videoTrack).to.not.equal(undefined);
              });
            });
          });
        });
      });
    });
  });
});
