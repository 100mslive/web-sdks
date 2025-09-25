import { assign, createMachine } from 'xstate';
import { HMSTrackSource } from '../../../interfaces';

export interface TrackContext {
  enabled: boolean;
  trackId: string;
  source?: HMSTrackSource;
  peerId?: string;
  nativeTrack?: MediaStreamTrack;
  error?: Error;
}

export type TrackEvent =
  | { type: 'ENABLE' }
  | { type: 'DISABLE' }
  | { type: 'SET_NATIVE_TRACK'; track: MediaStreamTrack }
  | { type: 'TRACK_ENDED' }
  | { type: 'TRACK_MUTED' }
  | { type: 'TRACK_UNMUTED' }
  | { type: 'ERROR'; error: Error };

export const trackStateMachine = createMachine<TrackContext, TrackEvent>({
  id: 'track',
  initial: 'idle',
  context: {
    enabled: false,
    trackId: '',
    source: undefined,
    peerId: undefined,
    nativeTrack: undefined,
    error: undefined,
  },
  states: {
    idle: {
      on: {
        SET_NATIVE_TRACK: {
          target: 'ready',
          actions: assign({
            nativeTrack: (_, event) => event.track,
            trackId: (_, event) => event.track.id,
          }),
        },
      },
    },
    ready: {
      initial: 'disabled',
      states: {
        enabled: {
          on: {
            DISABLE: {
              target: 'disabled',
              actions: assign({ enabled: false }),
            },
            TRACK_MUTED: {
              target: 'muted',
            },
            TRACK_ENDED: {
              target: '#track.ended',
            },
          },
        },
        disabled: {
          on: {
            ENABLE: {
              target: 'enabled',
              actions: assign({ enabled: true }),
            },
            TRACK_ENDED: {
              target: '#track.ended',
            },
          },
        },
        muted: {
          on: {
            TRACK_UNMUTED: {
              target: 'enabled',
            },
            DISABLE: {
              target: 'disabled',
              actions: assign({ enabled: false }),
            },
            TRACK_ENDED: {
              target: '#track.ended',
            },
          },
        },
      },
      on: {
        ERROR: {
          target: 'error',
          actions: assign({ error: (_, event) => event.error }),
        },
      },
    },
    ended: {
      type: 'final',
    },
    error: {
      on: {
        SET_NATIVE_TRACK: {
          target: 'ready',
          actions: assign({
            nativeTrack: (_, event) => event.track,
            trackId: (_, event) => event.track.id,
            error: undefined,
          }),
        },
      },
    },
  },
});
