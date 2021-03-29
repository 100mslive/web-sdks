export enum HMSMode {
  PUBLISH_AND_SUBSCRIBE,
  ONLY_PUBLISH,
  ONLY_SUBSCRIBE,
  AUTO,
}

export type HMSError = {
  code: number;
  reason: string;
};
