import { HMSPeer } from './peer';
import { HMSRole } from '../../interfaces';
import { HMSMessage } from '../../interfaces/message';
import { SendMessage } from '../../notification-manager';
import { ISignalParamsProvider } from '../../signal/ISignalSendParamsProvider';

export default class Message implements HMSMessage, ISignalParamsProvider<SendMessage> {
  sender?: HMSPeer;
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
    const roles = this.recipientRoles?.map(role => role.name);
    const peer = this.recipientPeer?.peerId;
    const sendParams: SendMessage = {
      info: {
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

  toString() {
    return `{
      sender: ${this.sender};
      recipientPeer: ${this.recipientPeer};
      recipientRoles: ${this.recipientRoles?.map(role => role.name)};
      message: ${this.message};
      time: ${this.time};
      type: ${this.type};
    }`;
  }
}
