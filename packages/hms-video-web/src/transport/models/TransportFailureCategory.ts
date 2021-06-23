export enum TransportFailureCategory {
  ConnectFailed,
  SignalDisconnect,
  PublishIceConnectionFailed,
  SubscribeIceConnectionFailed,
}

export const Dependencies = {
  [TransportFailureCategory.ConnectFailed]: [],
  [TransportFailureCategory.SignalDisconnect]: [],
  [TransportFailureCategory.PublishIceConnectionFailed]: [TransportFailureCategory.SignalDisconnect],
  [TransportFailureCategory.SubscribeIceConnectionFailed]: [TransportFailureCategory.SignalDisconnect],
};
