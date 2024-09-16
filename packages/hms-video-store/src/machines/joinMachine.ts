import { assign, createMachine, fromPromise } from 'xstate';
import { ErrorCodes } from '../error/ErrorCodes';
import { HMSException } from '../internal';
import { InitConfig } from '../signal/init/models';
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

type JoinEvents = { type: 'init'; payload: joinParams } | { type: 'retry' } | any;

export const joinMachine = (transport: HMSTransport, isPreview = false) =>
  createMachine({
    id: 'joinMachine',
    initial: 'idle',
    types: {} as {
      context: { retryCount: number; error: HMSException | null; initConfig?: InitConfig } & joinParams;
      events: JoinEvents;
      output: { data?: HMSException; initConfig?: InitConfig };
    },
    context: {
      authToken: '',
      peerId: '',
      customData: { name: '', metaData: '' },
      initEndpoint: '',
      autoSubscribeVideo: false,
      retryCount: 0,
      error: null,
    },
    states: {
      idle: {
        on: {
          init: {
            target: 'init',
            actions: assign(({ event }) => {
              return event.payload;
            }),
          },
        },
      },
      init: {
        entry: assign({
          retryCount: ({ context }) => context.retryCount + 1,
        }),
        invoke: {
          id: 'initService',
          src: fromPromise(({ input }) => {
            return isPreview ? transport.preview(input) : transport.join(input);
          }),
          input: ({ context }) => context,
          onDone: {
            target: 'ws',
            actions: assign({ initConfig: ({ event }) => event.output }),
          },
          onError: [
            {
              target: 'init',
              reenter: true,
              guard: ({ context, event }) => {
                console.log({
                  retry: shouldRetryError(event.error),
                  count: context.retryCount,
                  error: event.error,
                });
                return shouldRetryError(event.error) && context.retryCount < 5;
              },
            },
            {
              actions: assign({ error: ({ event }) => event.error as HMSException }),
              guard: ({ context, event }) => {
                return !shouldRetryError(event.error) || context.retryCount >= 5;
              },
              target: 'failed',
            },
          ],
        },
      },
      ws: {
        invoke: {
          src: fromPromise(({ input }) => {
            return transport.openSignal(input.authToken, input.peerId);
          }),
          input: ({ context }) => ({ authToken: context.authToken, peerId: context.peerId }),
          onDone: {
            target: isPreview ? 'success' : 'iceConnection',
          },
          onError: [
            {
              target: 'ws',
              guard: ({ context, event }) => {
                return shouldRetryError(event.error) && context.retryCount < 5;
              },
            },
            {
              guard: ({ context, event }) => {
                return !shouldRetryError(event.error) || context.retryCount >= 5;
              },
              target: 'failed',
            },
          ],
        },
      },
      iceConnection: {
        invoke: {
          src: fromPromise(({ input }) => {
            return transport.createConnectionsAndNegotiateJoin(input.customData, input.autoSubscribeVideo);
          }),
          input: ({ context }) => ({ customData: context.customData, autoSubscribeVideo: context.autoSubscribeVideo }),
          onDone: {
            target: 'success',
          },
          onError: [
            {
              target: 'iceConnection',
              guard: ({ context, event }) => {
                return shouldRetryError(event.error) && context.retryCount < 5;
              },
            },
            {
              guard: ({ context, event }) => {
                return !shouldRetryError(event.error) || context.retryCount >= 5;
              },
              target: 'failed',
            },
          ],
        },
      },
      success: {
        type: 'final',
        output: ({ context }) => {
          return { initConfig: context.initConfig, error: context.error };
        },
      },
      failed: {
        type: 'final',
        output: ({ context }) => {
          console.log('output final state', { error: context.error });
          return context.error;
        },
      },
    },
  });
