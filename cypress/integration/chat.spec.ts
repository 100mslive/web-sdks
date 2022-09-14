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

  it('should broadcast message to everyone', () => {
    cy.wrap(room.joinAll()).then(() => {
      expect(localPeer.isConnected()).to.be.true;
      expect(remotePeer.isConnected()).to.be.true;
      remotePeer.store.subscribe(messages => {
        expect(messages[0]).to.equal(chatMessage);
      }, selectHMSMessages);
      localPeer.sendMessage(chatMessage);
    });
  });

  it('should send message to group of roles', () => {
    cy.wrap(room.joinAll()).then(() => {
      expect(localPeer.isConnected()).to.be.true;
      expect(remotePeer.isConnected()).to.be.true;
      remotePeer.store.subscribe(messages => {
        expect(messages[0]).to.equal(chatMessage);
      }, selectMessagesByRole('student'));
      localPeer.sendMessage(chatMessage, ['student']);
    });
  });

  it('should send message to particular peer', () => {
    cy.wrap(room.joinAll()).then(() => {
      expect(localPeer.isConnected()).to.be.true;
      expect(remotePeer.isConnected()).to.be.true;
      remotePeer.store.subscribe(messages => {
        expect(messages[0]).to.equal(chatMessage);
      }, selectMessagesByPeerID(remotePeer.id));
      localPeer.sendMessage(chatMessage, undefined, remotePeer.id);
    });
  });
});
