import { assign, createMachine } from 'xstate';
import { HMSPreferredSimulcastLayer, HMSSimulcastLayerDefinition, HMSTrackSource } from '../../../interfaces';

export interface RemoteTrackContext {
  enabled: boolean;
  trackId: string;
  source?: HMSTrackSource;
  peerId?: string;
  nativeTrack?: MediaStreamTrack;
  degraded: boolean;
  degradedAt?: Date | null;
  layerDefinitions: HMSSimulcastLayerDefinition[];
  preferredLayer?: HMSPreferredSimulcastLayer;
  sinkCount: number;
  error?: Error;
}

export type RemoteTrackEvent =
  | { type: 'SET_NATIVE_TRACK'; track: MediaStreamTrack }
  | { type: 'ADD_SINK'; elementId?: string }
  | { type: 'REMOVE_SINK'; elementId?: string }
  | { type: 'SET_ENABLED'; enabled: boolean }
  | { type: 'DEGRADE' }
  | { type: 'RESTORE' }
  | { type: 'SET_LAYER'; layer: HMSPreferredSimulcastLayer }
  | { type: 'SET_LAYER_DEFINITIONS'; definitions: HMSSimulcastLayerDefinition[] }
  | { type: 'TRACK_ENDED' }
  | { type: 'ERROR'; error: Error };

export const remoteTrackStateMachine = createMachine<RemoteTrackContext, RemoteTrackEvent>({
  id: 'remoteTrack',
  initial: 'idle',
  context: {
    enabled: false,
    trackId: '',
    source: undefined,
    peerId: undefined,
    nativeTrack: undefined,
    degraded: false,
    degradedAt: null,
    layerDefinitions: [],
    preferredLayer: undefined,
    sinkCount: 0,
    error: undefined,
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
        subscription: {
          initial: 'unsubscribed',
          states: {
            unsubscribed: {
              on: {
                ADD_SINK: {
                  target: 'subscribing',
                  actions: assign({
                    sinkCount: context => context.sinkCount + 1,
                  }),
                },
              },
            },
            subscribing: {
              invoke: {
                src: 'subscribe',
                onDone: {
                  target: 'subscribed',
                },
                onError: {
                  target: 'unsubscribed',
                  actions: assign({
                    error: (_, event) => event.data,
                    sinkCount: context => Math.max(0, context.sinkCount - 1),
                  }),
                },
              },
            },
            subscribed: {
              on: {
                ADD_SINK: {
                  actions: assign({
                    sinkCount: context => context.sinkCount + 1,
                  }),
                },
                REMOVE_SINK: [
                  {
                    target: 'unsubscribing',
                    cond: context => context.sinkCount <= 1,
                    actions: assign({
                      sinkCount: 0,
                    }),
                  },
                  {
                    actions: assign({
                      sinkCount: context => Math.max(0, context.sinkCount - 1),
                    }),
                  },
                ],
              },
            },
            unsubscribing: {
              invoke: {
                src: 'unsubscribe',
                onDone: {
                  target: 'unsubscribed',
                },
                onError: {
                  target: 'subscribed',
                  actions: assign({
                    error: (_, event) => event.data,
                  }),
                },
              },
            },
          },
        },
        quality: {
          initial: 'normal',
          states: {
            normal: {
              on: {
                DEGRADE: {
                  target: 'degraded',
                  actions: assign({
                    degraded: true,
                    degradedAt: () => new Date(),
                  }),
                },
                SET_LAYER: {
                  actions: assign({
                    preferredLayer: (_, event) => event.layer,
                  }),
                },
              },
            },
            degraded: {
              on: {
                RESTORE: {
                  target: 'normal',
                  actions: assign({
                    degraded: false,
                    degradedAt: null,
                  }),
                },
                SET_LAYER: {
                  actions: assign({
                    preferredLayer: (_, event) => event.layer,
                  }),
                },
              },
            },
          },
        },
        enablement: {
          initial: 'disabled',
          states: {
            enabled: {
              on: {
                SET_ENABLED: [
                  {
                    target: 'disabled',
                    cond: (_, event) => !event.enabled,
                    actions: assign({ enabled: false }),
                  },
                ],
              },
            },
            disabled: {
              on: {
                SET_ENABLED: [
                  {
                    target: 'enabled',
                    cond: (_, event) => event.enabled,
                    actions: assign({ enabled: true }),
                  },
                ],
              },
            },
          },
        },
      },
      on: {
        SET_LAYER_DEFINITIONS: {
          actions: assign({
            layerDefinitions: (_, event) => event.definitions,
          }),
        },
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
