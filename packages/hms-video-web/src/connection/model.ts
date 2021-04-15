export enum HMSConnectionRole {
  PUBLISH = 0,
  SUBSCRIBE = 1,
}

export interface HMSTrickle {
  candidate: RTCIceCandidateInit;
  target: HMSConnectionRole;
}
