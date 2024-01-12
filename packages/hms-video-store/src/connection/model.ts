// Sent in trickle messages as target - biz understands only 0 and 1
export enum HMSConnectionRole {
  Publish = 0,
  Subscribe = 1,
}

export interface HMSTrickle {
  candidate: RTCIceCandidateInit;
  target: HMSConnectionRole;
}
