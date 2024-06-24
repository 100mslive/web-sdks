import { HMSRole } from '../internal';

export const DIAGNOSTICS_ROOM_ID = '6669151f480e55c215299a4a';

export const CONNECTIVITY_TEST_DURATION = 20_000;
export const MIC_CHECK_RECORD_DURATION = 10_000;

export const diagnosticsRole: HMSRole = {
  name: 'diagnostics-role',
  priority: 1,
  publishParams: {
    allowed: ['audio', 'video'],
    audio: { bitRate: 32, codec: 'opus' },
    video: {
      bitRate: 100,
      codec: 'vp8',
      frameRate: 30,
      height: 720,
      width: 1280,
    },
    screen: {
      bitRate: 100,
      codec: 'vp8',
      frameRate: 10,
      height: 1080,
      width: 1920,
    },
  },
  subscribeParams: {
    subscribeToRoles: [],
    maxSubsBitRate: 3200,
  },
  permissions: {
    browserRecording: false,
    changeRole: false,
    endRoom: false,
    hlsStreaming: false,
    mute: false,
    pollRead: false,
    pollWrite: false,
    removeOthers: false,
    rtmpStreaming: false,
    unmute: false,
  },
};

export const DEFAULT_TEST_AUDIO_URL = 'https://100ms.live/test-audio.wav';
