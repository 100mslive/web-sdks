export enum TransportFailureCategory {
  ConnectFailed,
  SignalDisconnect,
  JoinWSMessageFailed,
  PublishIceConnectionFailed,
  SubscribeIceConnectionFailed,
  PublishFailed,
  UnpublishFailed,
}

export const Dependencies = {
  [TransportFailureCategory.ConnectFailed]: [],
  [TransportFailureCategory.SignalDisconnect]: [],
  [TransportFailureCategory.JoinWSMessageFailed]: [TransportFailureCategory.SignalDisconnect],
  [TransportFailureCategory.PublishIceConnectionFailed]: [TransportFailureCategory.SignalDisconnect],
  [TransportFailureCategory.SubscribeIceConnectionFailed]: [TransportFailureCategory.SignalDisconnect],
  [TransportFailureCategory.PublishFailed]: [TransportFailureCategory.SignalDisconnect],
  [TransportFailureCategory.UnpublishFailed]: [TransportFailureCategory.SignalDisconnect],
};
