import { assign, createMachine } from 'xstate';
import { HMSTrackSource } from '../../tracks/HMSTrack';

export interface LocalTrackContext {
  enabled: boolean;
  trackId: string;
  source?: HMSTrackSource;
  nativeTrack?: MediaStreamTrack;
  processedTrack?: MediaStreamTrack;
  deviceId?: string;
  settings?: any;
  permissionState?: PermissionState;
  isPublished: boolean;
  publishedTrackId?: string;
  error?: Error;
  isReplacing: boolean;
}

export type LocalTrackEvent =
  | { type: 'ENABLE' }
  | { type: 'DISABLE' }
  | { type: 'SET_NATIVE_TRACK'; track: MediaStreamTrack }
  | { type: 'SET_PROCESSED_TRACK'; track: MediaStreamTrack | undefined }
  | { type: 'REPLACE_TRACK'; track: MediaStreamTrack; deviceId?: string }
  | { type: 'REPLACE_TRACK_SUCCESS'; track: MediaStreamTrack }
  | { type: 'REPLACE_TRACK_FAILURE'; error: Error }
  | { type: 'UPDATE_SETTINGS'; settings: any }
  | { type: 'PUBLISH' }
  | { type: 'UNPUBLISH' }
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'PERMISSION_DENIED' }
  | { type: 'PERMISSION_PROMPT' }
  | { type: 'TRACK_ENDED' }
  | { type: 'TRACK_MUTED' }
  | { type: 'TRACK_UNMUTED' }
  | { type: 'VISIBILITY_HIDDEN' }
  | { type: 'VISIBILITY_VISIBLE' }
  | { type: 'ERROR'; error: Error };

export const localTrackStateMachine = createMachine<LocalTrackContext, LocalTrackEvent>({
  id: 'localTrack',
  initial: 'idle',
  context: {
    enabled: false,
    trackId: '',
    source: undefined,
    nativeTrack: undefined,
    processedTrack: undefined,
    deviceId: undefined,
    settings: undefined,
    permissionState: undefined,
    isPublished: false,
    publishedTrackId: undefined,
    error: undefined,
    isReplacing: false,
  },
  states: {
    idle: {
      on: {
        SET_NATIVE_TRACK: {
          target: 'active',
          actions: assign({
            nativeTrack: (_, event) => event.track,
            trackId: (_, event) => event.track.id,
          }),
        },
      },
    },
    active: {
      type: 'parallel',
      states: {
        enablement: {
          initial: 'disabled',
          states: {
            enabled: {
              on: {
                DISABLE: {
                  target: 'disabling',
                },
                TRACK_MUTED: {
                  target: 'muted',
                },
              },
            },
            disabled: {
              on: {
                ENABLE: {
                  target: 'enabling',
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
                },
              },
            },
            enabling: {
              invoke: {
                src: 'enableTrack',
                onDone: {
                  target: 'enabled',
                  actions: assign({ enabled: true }),
                },
                onError: {
                  target: 'disabled',
                  actions: assign({
                    error: (_, event) => event.data,
                  }),
                },
              },
            },
            disabling: {
              invoke: {
                src: 'disableTrack',
                onDone: {
                  target: 'disabled',
                  actions: assign({ enabled: false }),
                },
                onError: {
                  target: 'enabled',
                  actions: assign({
                    error: (_, event) => event.data,
                  }),
                },
              },
            },
          },
        },
        publishing: {
          initial: 'unpublished',
          states: {
            unpublished: {
              on: {
                PUBLISH: 'publishing',
              },
            },
            publishing: {
              invoke: {
                src: 'publishTrack',
                onDone: {
                  target: 'published',
                  actions: assign({
                    isPublished: true,
                    publishedTrackId: (_, event) => event.data.trackId,
                  }),
                },
                onError: {
                  target: 'unpublished',
                  actions: assign({
                    error: (_, event) => event.data,
                  }),
                },
              },
            },
            published: {
              on: {
                UNPUBLISH: 'unpublishing',
              },
            },
            unpublishing: {
              invoke: {
                src: 'unpublishTrack',
                onDone: {
                  target: 'unpublished',
                  actions: assign({
                    isPublished: false,
                    publishedTrackId: undefined,
                  }),
                },
                onError: {
                  target: 'published',
                  actions: assign({
                    error: (_, event) => event.data,
                  }),
                },
              },
            },
          },
        },
        permission: {
          initial: 'checking',
          states: {
            checking: {
              on: {
                PERMISSION_GRANTED: 'granted',
                PERMISSION_DENIED: 'denied',
                PERMISSION_PROMPT: 'prompt',
              },
            },
            granted: {
              on: {
                PERMISSION_DENIED: 'denied',
              },
            },
            denied: {
              on: {
                PERMISSION_GRANTED: 'granted',
              },
            },
            prompt: {
              on: {
                PERMISSION_GRANTED: 'granted',
                PERMISSION_DENIED: 'denied',
              },
            },
          },
        },
        replacement: {
          initial: 'idle',
          states: {
            idle: {
              on: {
                REPLACE_TRACK: {
                  target: 'replacing',
                  actions: assign({ isReplacing: true }),
                },
                UPDATE_SETTINGS: {
                  actions: assign({
                    settings: (_, event) => event.settings,
                  }),
                },
              },
            },
            replacing: {
              invoke: {
                src: 'replaceTrack',
                onDone: {
                  target: 'idle',
                  actions: assign({
                    nativeTrack: (_, event) => event.data.track,
                    trackId: (_, event) => event.data.track.id,
                    deviceId: (_, event) => event.data.deviceId,
                    isReplacing: false,
                    error: undefined,
                  }),
                },
                onError: {
                  target: 'idle',
                  actions: assign({
                    error: (_, event) => event.data,
                    isReplacing: false,
                  }),
                },
              },
            },
          },
        },
        visibility: {
          initial: 'visible',
          states: {
            visible: {
              on: {
                VISIBILITY_HIDDEN: 'hidden',
              },
            },
            hidden: {
              on: {
                VISIBILITY_VISIBLE: 'visible',
              },
            },
          },
        },
        processing: {
          initial: 'unprocessed',
          states: {
            unprocessed: {
              on: {
                SET_PROCESSED_TRACK: {
                  target: 'processed',
                  actions: assign({
                    processedTrack: (_, event) => event.track,
                  }),
                },
              },
            },
            processed: {
              on: {
                SET_PROCESSED_TRACK: [
                  {
                    target: 'unprocessed',
                    cond: (_, event) => !event.track,
                    actions: assign({ processedTrack: undefined }),
                  },
                  {
                    target: 'processed',
                    actions: assign({
                      processedTrack: (_, event) => event.track,
                    }),
                  },
                ],
              },
            },
          },
        },
      },
      on: {
        TRACK_ENDED: 'ended',
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
          target: 'active',
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
