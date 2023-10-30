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

__hms.actions.startRTMPOrRecording({
  meetingURL: 'https://amar.qa-app.100ms.live/meeting/hwt-diz-gxv?skip_preview=true',
  rtmpURLs: ['rtmp://b.rtmp.youtube.com/live2/uu63-srhy-w3uu-t0w6-96td'],
  record: true,
});
