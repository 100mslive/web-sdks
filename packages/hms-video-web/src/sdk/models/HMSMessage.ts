import { HMSRole } from '../../interfaces';
import { HMSMessage } from '../../interfaces/message';
import { ISignalParamsProvider } from '../../signal/ISignalSendParamsProvider';
import { SendMessage } from './HMSNotifications';
import { HMSPeer } from './peer';

export default class Message implements HMSMessage, ISignalParamsProvider<SendMessage> {
  sender: HMSPeer;
  recipientPeers?: HMSPeer[];
  recipientRoles?: HMSRole[];
  message: any;
  time: Date;
  type: string;
  isPrivate?: boolean;

  constructor({ sender, message, type = 'chat', recipientPeers, recipientRoles, time, isPrivate }: HMSMessage) {
    this.sender = sender;
    this.message = message;
    this.type = type;
    this.recipientPeers = recipientPeers;
    this.recipientRoles = recipientRoles;
    this.time = time;
    this.isPrivate = isPrivate;
  }

  toSignalParams() {
    const roles = this.recipientRoles?.map((role) => role.name);
    const peer = this.recipientPeers?.map((peer) => peer.peerId)[0];
    const sendParams: SendMessage = {
      info: {
        sender: this.sender.peerId,
        message: this.message,
        type: this.type,
      },
    };
    if (roles?.length) {
      sendParams.roles = roles;
    }
    if (peer) {
      sendParams.peer_id = peer;
    }
    return sendParams;
  }
}
