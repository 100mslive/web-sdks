export interface HLSConfig {
  variants: Array<HLSMeetingURLVariant>;
}

export interface HLSMeetingURLVariant {
  meetingURL: string;
  metadata?: string;
}
