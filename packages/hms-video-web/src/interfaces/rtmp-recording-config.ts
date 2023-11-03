export interface RTMPRecordingConfig {
  meetingURL?: string;
  rtmpURLs?: Array<string>;
  record: boolean;
  resolution?: RTMPRecordingResolution;
}

export interface RTMPRecordingResolution {
  width: number;
  height: number;
}
