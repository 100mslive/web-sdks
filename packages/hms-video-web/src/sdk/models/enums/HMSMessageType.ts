// String enum to pass type as string for identification on receiver's end.
export enum HMSMessageType {
  CHAT = 'chat',
}

export const getMessageType = (type: string) => {
  // Default type is CHAT
  if (!type) {
    return HMSMessageType.CHAT;
  }

  switch (type) {
    case 'chat':
      return HMSMessageType.CHAT;
    default:
      throw Error(`Unsupported message type=${type} received`);
  }
};
