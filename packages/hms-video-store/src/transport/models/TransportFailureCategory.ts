export enum TransportFailureCategory {
  ConnectFailed,
  SignalDisconnect,
  JoinWSMessageFailed,
  PublishIceConnectionFailed,
  SubscribeIceConnectionFailed,
  PublishFailed,
}

export const Dependencies = {
  [TransportFailureCategory.ConnectFailed]: [],
  [TransportFailureCategory.SignalDisconnect]: [],
  [TransportFailureCategory.JoinWSMessageFailed]: [TransportFailureCategory.SignalDisconnect],
  [TransportFailureCategory.PublishIceConnectionFailed]: [TransportFailureCategory.SignalDisconnect],
  [TransportFailureCategory.SubscribeIceConnectionFailed]: [TransportFailureCategory.SignalDisconnect],
  [TransportFailureCategory.PublishFailed]: [TransportFailureCategory.SignalDisconnect],
};
