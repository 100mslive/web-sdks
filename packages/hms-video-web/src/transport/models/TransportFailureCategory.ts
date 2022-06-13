export enum TransportFailureCategory {
  ConnectFailed,
  SignalDisconnect,
  PublishNegotiationFailed,
  PublishIceConnectionFailed,
  SubscribeIceConnectionFailed,
}

export const Dependencies = {
  [TransportFailureCategory.ConnectFailed]: [],
  [TransportFailureCategory.SignalDisconnect]: [],
  [TransportFailureCategory.PublishNegotiationFailed]: [TransportFailureCategory.SignalDisconnect],
  [TransportFailureCategory.PublishIceConnectionFailed]: [TransportFailureCategory.SignalDisconnect],
  [TransportFailureCategory.SubscribeIceConnectionFailed]: [TransportFailureCategory.SignalDisconnect],
};
