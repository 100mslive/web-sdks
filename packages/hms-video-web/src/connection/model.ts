export enum HMSConnectionRole {
  Publish = 'Publish',
  Subscribe = 'Subscribe',
}

export interface HMSTrickle {
  candidate: RTCIceCandidateInit;
  target: HMSConnectionRole;
}
