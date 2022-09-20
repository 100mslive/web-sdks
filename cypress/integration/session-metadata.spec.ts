import { selectSessionMetadata } from '@100mslive/hms-video-store';
import { CypressPeer } from '../support/peer';
import { CypressRoom } from '../support/room';

let localPeer: CypressPeer;
let remotePeer: CypressPeer;
let room: CypressRoom;

let token;

const TEST_METADATA = 'test-metadata';

describe('session metadata api', () => {
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

  it('set metadata snd get metadata', () => {
    cy.wrap(room.joinAll()).then(() => {
      cy.wrap(localPeer.actions.setSessionMetadata(TEST_METADATA)).then(() => {
        cy.wrap(localPeer.store.getState(selectSessionMetadata)).then(localPeerMetadata => {
          expect(localPeerMetadata).equal(TEST_METADATA);
        });

        cy.wrap(remotePeer.actions.populateSessionMetadata()).then(() => {
          cy.wrap(remotePeer.store.getState(selectSessionMetadata)).then(remotePeerMetadata => {
            expect(remotePeerMetadata).equal(TEST_METADATA);
          });
        });
      });
    });
  });
});
