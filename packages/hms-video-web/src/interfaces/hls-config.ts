export interface HLSConfig {
  variants: Array<HLSVariant>;
}

export interface HLSVariant {
  meetingURL: string;
  metadata?: string;
}
