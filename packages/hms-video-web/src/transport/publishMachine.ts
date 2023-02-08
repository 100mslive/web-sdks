import { assign, createMachine, send } from 'xstate';
import HMSPublishConnection from '../connection/publish/publishConnection';
import { HMSException } from '../error/HMSException';
import { TrackState } from '../notification-manager';

interface PublishContext {
  trackStates: Map<string, TrackState>;
  publishConnection: HMSPublishConnection | null;
}
export const publishMachine = createMachine<PublishContext>({
  id: 'publishMachine',
  initial: 'idle',
  context: {
    trackStates: new Map<string, TrackState>(),
    publishConnection: null,
  },
  states: {
    idle: {
      on: {
        PUBLISH: {
          target: 'publish',
          actions(context, event) {
            const track = event.track;
            track.publishedTrackId = track.getTrackIDBeingSent();
            context.trackStates.set(track.publishedTrackId, track);
          },
        },
      },
    },
    publish: {},
  },
});

export const peerConnectionMachine = createMachine<{ connection: RTCPeerConnection | null }>({
  id: 'peerConnectionMachine',
  initial: 'idle',
  context: {
    connection: null,
  },
  states: {
    idle: {
      on: {
        connected: 'connected',
        disconnected: 'disconnected',
        connecting: 'connecting',
        closed: 'closed',
      },
      invoke: {
        src: (context, event) => send => {
          const { config } = event;
          context.connection = new RTCPeerConnection(config);
          context.connection.onconnectionstatechange = () => {
            send({ type: context.connection?.connectionState! });
          };
        },
      },
    },
    connecting: {},
    connected: {},
    disconnected: {},
    closed: {},
  },
});

interface RetryContext {
  retryCount: number;
  error: HMSException | null;
  task: null | (() => Promise<boolean>);
  success: boolean;
  maxRetries: number;
}

interface RetryEventObject {
  type: 'SCHEDULE';
  task: () => Promise<boolean>;
  data?: HMSException;
}

export const RetryMachine = createMachine<RetryContext, RetryEventObject>({
  id: 'retryMachine',
  initial: 'idle',
  context: {
    retryCount: 0,
    error: null,
    success: false,
    task: null,
    maxRetries: 5,
  },
  states: {
    idle: {
      on: {
        SCHEDULE: 'schedule',
      },
    },
    schedule: {
      invoke: {
        src: (context, event) => {
          if (event.task) {
            context.task = event.task;
          }
          return event.task();
        },
        onDone: 'success',
        onError: 'error',
      },
    },
    success: {
      entry: assign({
        success: true,
        error: null,
        retryCount: 0,
      }),
      type: 'final',
    },
    error: {
      on: {
        SCHEDULE: [
          { target: 'schedule', cond: context => context.retryCount < context.maxRetries },
          { target: 'failed', cond: context => context.retryCount < context.maxRetries },
        ],
      },
      entry: [
        assign<RetryContext, RetryEventObject>({
          success: false,
          error: (_, event) => event.data || null,
          retryCount: context => context.retryCount + 1,
        }),
        send<RetryContext, RetryEventObject>(
          context => {
            return { type: 'SCHEDULE', task: context.task };
          },
          {
            delay: context => Math.pow(2, context.retryCount) * 1000,
          },
        ),
      ],
    },
    failed: {
      type: 'final',
    },
  },
});
