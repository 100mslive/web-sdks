import { HMSRole } from '../../interfaces';
import { HMSMessage } from '../../interfaces/message';
import { ISignalParamsProvider } from '../../signal/ISignalSendParamsProvider';
import { SendMessage } from './HMSNotifications';
import { HMSPeer } from './peer';

export default class Message implements HMSMessage, ISignalParamsProvider<SendMessage> {
  sender: HMSPeer;
  recipientPeer?: HMSPeer;
  recipientRoles?: HMSRole[];
  message: any;
  time: Date;
  type: string;

  constructor({ sender, message, type = 'chat', recipientPeer, recipientRoles, time }: HMSMessage) {
    this.sender = sender;
    this.message = message;
    this.type = type;
    this.recipientPeer = recipientPeer;
    this.recipientRoles = recipientRoles;
    this.time = time;
  }

  toSignalParams() {
    const roles = this.recipientRoles?.map((role) => role.name);
    const peer = this.recipientPeer?.peerId;
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
