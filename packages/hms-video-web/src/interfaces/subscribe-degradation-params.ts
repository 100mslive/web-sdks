export interface SubscribeDegradationParams {
  packetLossThreshold: number;
  degradeGracePeriodSeconds: number;
  recoverGracePeriodSeconds: number;
}
