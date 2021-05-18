export enum HMSConnectionRole {
  Publish = 0,
  Subscribe = 1,
}

export interface HMSTrickle {
  candidate: RTCIceCandidateInit;
  target: HMSConnectionRole;
}
