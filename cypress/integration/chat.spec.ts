import { CypressPeer } from '../support/peer';
import { CypressRoom } from '../support/room';

let token: string;
let localPeer: CypressPeer;
let remotePeer: CypressPeer;
let remotePeer2: CypressPeer;
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
    remotePeer2 = new CypressPeer(token);

    room = new CypressRoom(localPeer, remotePeer, remotePeer2);
  });

  afterEach(() => {
    if (room) {
      room.leaveAll();
    }
  });

  it('should send message to everyone', () => {
    cy.wrap(room.joinAll())
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
    cy.wrap(room.joinAll())
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
    cy.wrap(room.joinAll())
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
        expect(messages[0].recipientRoles[0]).to.equal('student');
      });
  });

  it('should send message to particular peer id', () => {
    cy.wrap(room.joinAll())
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

  it('should not send peer message to everyone', () => {
    cy.wrap(room.joinAll())
      .then(() => {
        expect(localPeer.isConnected()).to.be.true;
        expect(remotePeer.isConnected()).to.be.true;
        return localPeer.sendMessage(chatMessage, undefined, remotePeer.id);
      })
      .then(() => {
        const messages = remotePeer2.store.getState().messages.allIDs;
        expect(messages.length).to.equal(0);
      });
  });

  it('should not send group messages to everyone', () => {
    cy.wrap(room.joinAll())
      .then(() => {
        expect(localPeer.isConnected()).to.be.true;
        expect(remotePeer.isConnected()).to.be.true;
        return localPeer.sendMessage(chatMessage, ['student']);
      })
      .then(() => {
        const messages = remotePeer.store.getState().messages.allIDs;
        expect(messages.length).to.equal(0);
      });
  });
});
