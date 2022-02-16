import {
  selectHLSState,
  selectRecordingState,
  selectRTMPState,
  useHMSStore,
} from "@100mslive/react-sdk";

export const useRecordingStreaming = () => {
  const recording = useHMSStore(selectRecordingState);
  const rtmp = useHMSStore(selectRTMPState);
  const hls = useHMSStore(selectHLSState);

  const isServerRecordingOn = recording.server.running;
  const isBrowserRecordingOn = recording.browser.running;
  const isStreamingOn = hls.running || rtmp.running;

  return {
    isServerRecordingOn,
    isBrowserRecordingOn,
    isStreamingOn,
    isHLSRunning: hls.running,
  };
};
