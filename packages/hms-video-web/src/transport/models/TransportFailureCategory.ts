export enum TransportFailureCategory {
  ConnectFailed,
  SignalDisconnect,
  JoinWSMessageFailed,
  PublishIceConnectionFailed,
  SubscribeIceConnectionFailed,
}

export const Dependencies = {
  [TransportFailureCategory.ConnectFailed]: [],
  [TransportFailureCategory.SignalDisconnect]: [],
  [TransportFailureCategory.JoinWSMessageFailed]: [TransportFailureCategory.SignalDisconnect],
  [TransportFailureCategory.PublishIceConnectionFailed]: [TransportFailureCategory.SignalDisconnect],
  [TransportFailureCategory.SubscribeIceConnectionFailed]: [TransportFailureCategory.SignalDisconnect],
};
