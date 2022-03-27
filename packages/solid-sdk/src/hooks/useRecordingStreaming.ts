import { Accessor } from 'solid-js';
import { selectHLSState, selectRecordingState, selectRTMPState } from '@100mslive/hms-video-store';
import { useHMSStore } from '../primitives/HmsRoomProvider';

export interface useRecordingStreamingResult {
  isServerRecordingOn: Accessor<boolean>;
  isBrowserRecordingOn: Accessor<boolean>;
  isHLSRecordingOn: Accessor<boolean>;
  isStreamingOn: Accessor<boolean>;
  isHLSRunning: Accessor<boolean>;
  isRTMPRunning: Accessor<boolean>;
  isRecordingOn: Accessor<boolean>;
}

export const useRecordingStreaming = (): useRecordingStreamingResult => {
  const recording = useHMSStore(selectRecordingState);
  const rtmp = useHMSStore(selectRTMPState);
  const hls = useHMSStore(selectHLSState);

  const isServerRecordingOn = () => recording().server.running;
  const isBrowserRecordingOn = () => recording().browser.running;
  const isHLSRecordingOn = () => recording().hls.running;
  const isStreamingOn = () => hls().running || rtmp().running;
  const isRecordingOn = isServerRecordingOn || isBrowserRecordingOn || isHLSRecordingOn;

  return {
    isServerRecordingOn,
    isBrowserRecordingOn,
    isHLSRecordingOn,
    isStreamingOn,
    isHLSRunning: () => hls().running,
    isRTMPRunning: () => rtmp().running,
    isRecordingOn,
  };
};
