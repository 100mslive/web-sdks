export interface HLSConfig {
  variants: Array<HLSStartStopVariant>;
}

export interface HLSStartStopVariant {
  meetingURL: string;
  metadata?: string;
}
