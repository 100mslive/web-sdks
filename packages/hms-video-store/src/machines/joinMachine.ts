import { assign, createMachine } from 'xstate';
import { ErrorCodes } from '../error/ErrorCodes';
import { HMSException } from '../internal';
import HMSTransport from '../transport';

interface joinParams {
  authToken: string;
  peerId: string;
  customData: { name: string; metaData: string };
  initEndpoint: string;
  autoSubscribeVideo?: boolean;
}

function shouldRetryError(error: any) {
  return (
    error instanceof HMSException &&
    ([
      ErrorCodes.WebSocketConnectionErrors.WEBSOCKET_CONNECTION_LOST,
      ErrorCodes.WebSocketConnectionErrors.FAILED_TO_CONNECT,
      ErrorCodes.WebSocketConnectionErrors.ABNORMAL_CLOSE,
      ErrorCodes.APIErrors.ENDPOINT_UNREACHABLE,
    ].includes(error.code) ||
      error.code.toString().startsWith('5') ||
      error.code.toString().startsWith('429'))
  );
}

type JoinEvents = { type: 'init'; payload: joinParams } | { type: 'retry' };
export const joinMachine = (transport: HMSTransport) =>
  createMachine<{ retryCount: number } & joinParams, JoinEvents>({
    id: 'joinMachine',
    initial: 'idle',
    predictableActionArguments: true,
    context: {
      authToken: '',
      peerId: '',
      customData: { name: '', metaData: '' },
      initEndpoint: '',
      autoSubscribeVideo: false,
      retryCount: 0,
    },
    states: {
      idle: {
        on: {
          init: {
            target: 'init',
            actions: assign((_, event) => {
              return event.payload;
            }),
          },
        },
      },
      init: {
        entry: assign({
          retryCount: context => context.retryCount + 1,
        }),
        invoke: {
          id: 'initService',
          src: context => {
            console.log({ joinCall: 'joinCalled' });
            return transport.join(context);
          },
          onDone: {
            target: 'ws',
          },
          onError: [
            {
              target: 'init',
              cond: (context, event) => {
                return shouldRetryError(event.data) && context.retryCount < 5;
              },
            },
            {
              cond: (context, event) => {
                return !shouldRetryError(event.data) || context.retryCount >= 5;
              },
              target: 'failed',
            },
          ],
        },
      },
      ws: {
        invoke: {
          src: context => {
            return transport.openSignal(context.authToken, context.peerId);
          },
          onDone: {
            target: 'iceConnection',
          },
          onError: [
            {
              target: 'ws',
              cond: (context, event) => {
                return shouldRetryError(event.data) && context.retryCount < 5;
              },
            },
            {
              cond: (context, event) => {
                return !shouldRetryError(event.data) || context.retryCount >= 5;
              },
              target: 'failed',
            },
          ],
        },
      },
      iceConnection: {
        invoke: {
          src: context => {
            return transport.createConnectionsAndNegotiateJoin(context.customData, context.autoSubscribeVideo);
          },
          onDone: {
            target: 'success',
          },
          onError: [
            {
              target: 'iceConnection',
              cond: (context, event) => {
                return shouldRetryError(event.data) && context.retryCount < 5;
              },
            },
            {
              cond: (context, event) => {
                return !shouldRetryError(event.data) || context.retryCount >= 5;
              },
              target: 'failed',
            },
          ],
        },
      },
      success: {
        type: 'final',
      },
      failed: {
        type: 'final',
        // @ts-ignore
        data: (_, event) => event.data,
      },
    },
  });
