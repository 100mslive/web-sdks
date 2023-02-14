import cloneDeep from 'lodash.clonedeep';
import { createMachine } from 'xstate';
import { decodeJWT, HMSSdk, validateRTCPeerConnection } from '@100mslive/hms-video';
import { initialState } from './initial-state';
import { HMSDiagnosticsConfig, HMSDiagnosticsOutput } from './interfaces';
import { DEFAULT_DIAGNOSTICS_USERNAME, PROD_INIT_ENDPOINT } from './utils';

interface DiagnosticContext {
  results: HMSDiagnosticsOutput;
  config: HMSDiagnosticsConfig;
  initConfig: { endpoint: string; rtcConfiguration: RTCConfiguration };
}
export const diagnosticsMachine = (sdk: HMSSdk) =>
  createMachine<DiagnosticContext>({
    id: 'diagnostics',
    initial: 'idle',
    context: {
      results: cloneDeep(initialState),
      config: {
        authToken: '',
        initEndpoint: '',
        userName: '',
      },
      initConfig: {
        endpoint: '',
        rtcConfiguration: {},
      },
    },
    on: {
      STOP: 'stop',
    },
    states: {
      idle: {
        on: {
          START: {
            target: 'webrtc',
            actions: (context, event) => {
              context.config = event.config;
            },
          },
        },
      },
      webrtc: {
        invoke: {
          src: context => send => {
            let success = false;
            try {
              validateRTCPeerConnection();
              success = true;
            } catch (error) {
              context.results.webRTC.errorMessage = (error as Error).message;
            }
            context.results.webRTC.success = success;
            send('connectivity');
          },
        },
      },
      connectivity: {
        on: {
          NEXT: 'iceConnection',
        },
        invoke: {
          src: context => send => {
            const { config } = context;
            const { roomId } = decodeJWT(config.authToken);
            // @ts-ignore
            sdk.commonSetup(
              {
                authToken: config.authToken,
                userName: config.userName || DEFAULT_DIAGNOSTICS_USERNAME,
              },
              roomId,
            );

            try {
              // @ts-ignore
              const initConfig = await sdk.transport.connect(
                config.authToken,
                config.initEndpoint || PROD_INIT_ENDPOINT,
                Date.now(),
                { name: 'diagnostics' },
                false,
              );
              context.results.connectivity.init.success = true;
              context.results.connectivity.init.info = initConfig;
              context.initConfig.endpoint = initConfig.endpoint;
              context.initConfig.rtcConfiguration = initConfig.rtcConfiguration;
              send({ type: 'NEXT' });
            } catch (err) {
              context.results.connectivity.init.success = false;
              context.results.connectivity.init.errorMessage = (err as Error).message;
              send({ type: 'STOP' });
            }
          },
        },
      },
      iceConnection: {},
      devices: {},
      stop: {
        type: 'final',
      },
    },
  });
