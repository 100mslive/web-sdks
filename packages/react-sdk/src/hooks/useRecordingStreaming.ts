import { selectHLSState, selectRecordingState, selectRTMPState, useHMSStore } from '..';

export interface useRecordingStreamingResult {
  isServerRecordingOn: boolean;
  isBrowserRecordingOn: boolean;
  isHLSRecordingOn: boolean;
  isStreamingOn: boolean;
  isHLSRunning: boolean;
  isRTMPRunning: boolean;
  isRecordingOn: boolean;
}

export const useRecordingStreaming = (): useRecordingStreamingResult => {
  const recording = useHMSStore(selectRecordingState);
  const rtmp = useHMSStore(selectRTMPState);
  const hls = useHMSStore(selectHLSState);

  const isServerRecordingOn = recording.server.running;
  const isBrowserRecordingOn = recording.browser.running;
  const isHLSRecordingOn = recording.hls.running;
  const isStreamingOn = hls.running || rtmp.running;
  const isRecordingOn = isServerRecordingOn || isBrowserRecordingOn || isHLSRecordingOn;

  return {
    isServerRecordingOn,
    isBrowserRecordingOn,
    isHLSRecordingOn,
    isStreamingOn,
    isHLSRunning: hls.running,
    isRTMPRunning: rtmp.running,
    isRecordingOn,
  };
};
