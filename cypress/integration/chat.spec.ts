import { CypressPeer } from '../support/peer';
import { CypressRoom } from '../support/room';
import { selectHMSMessages, selectMessagesByPeerID, selectMessagesByRole } from '@100mslive/hms-video-store';

let token: string;
let localPeer: CypressPeer;
let remotePeer: CypressPeer;
let room: CypressRoom;
const chatMessage = 'Hello, how are you?';

describe('send chat messages', () => {
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

  it('should send message to everyone', () => {
    cy.wrap(room.joinAll(), { timeout: 10000 })
      .then(() => {
        expect(localPeer.isConnected()).to.be.true;
        expect(remotePeer.isConnected()).to.be.true;
        return localPeer.sendMessage(chatMessage);
      })
      .then(() => {
        return remotePeer.onSelectHMSMessages();
      })
      .then(messages => {
        expect(messages[0].message).to.equal(chatMessage);
        expect(messages[0].sender).to.equal(localPeer.id);
      });
  });

  it('should broadcast message to everyone', () => {
    cy.wrap(room.joinAll(), { timeout: 10000 })
      .then(() => {
        expect(localPeer.isConnected()).to.be.true;
        expect(remotePeer.isConnected()).to.be.true;
        return localPeer.sendMessage(chatMessage);
      })
      .then(() => {
        return remotePeer.onSelectBroadcastMessages();
      })
      .then(messages => {
        expect(messages[0].message).to.equal(chatMessage);
        expect(messages[0].sender).to.equal(localPeer.id);
      });
  });

  it('should send message to group of roles', () => {
    cy.wrap(room.joinAll(), { timeout: 10000 })
      .then(() => {
        expect(localPeer.isConnected()).to.be.true;
        expect(remotePeer.isConnected()).to.be.true;
        return localPeer.sendMessage(chatMessage, ['student']);
      })
      .then(() => {
        return remotePeer.onselectMessagesByRole('student');
      })
      .then(messages => {
        expect(messages[0].message).to.equal(chatMessage);
        expect(messages[0].sender).to.equal(localPeer.id);
      });
  });

  it('should send message to particular peer', () => {
    cy.wrap(room.joinAll(), { timeout: 10000 })
      .then(() => {
        expect(localPeer.isConnected()).to.be.true;
        expect(remotePeer.isConnected()).to.be.true;
        return localPeer.sendMessage(chatMessage, undefined, remotePeer.id);
      })
      .then(() => {
        return remotePeer.onselectMessagesByPeerID(localPeer.id);
      })
      .then(messages => {
        expect(messages[0].message).to.equal(chatMessage);
        expect(messages[0].sender).to.equal(localPeer.id);
      });
  });
});
