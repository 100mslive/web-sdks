import { createMachine } from 'xstate';
import { decodeJWT, HMSSdk, validateMediaDevicesExistence, validateRTCPeerConnection } from '@100mslive/hms-video';
import { initialState } from './initial-state';
import { DiagnosticContext } from './interfaces';
import {
  checkCamera,
  checkMicrophone,
  DEFAULT_DIAGNOSTICS_USERNAME,
  getIceCandidateType,
  PROD_INIT_ENDPOINT,
} from './utils';

export const diagnosticsMachine = (sdk: HMSSdk) =>
  createMachine<DiagnosticContext>({
    id: 'diagnostics',
    initial: 'idle',
    context: {
      results: initialState,
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
        on: {
          NEXT: 'connectivity',
        },
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
            send({ type: 'NEXT' });
          },
        },
      },
      connectivity: {
        on: {
          NEXT: 'iceConnection',
        },
        invoke: {
          src: context => async send => {
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
              context.results.connectivity.websocket.success = true;
              send({ type: 'NEXT' });
            } catch (err) {
              context.results.connectivity.init.success = false;
              context.results.connectivity.init.errorMessage = (err as Error).message;
              send({ type: 'STOP' });
            }
          },
        },
      },
      iceConnection: {
        on: {
          NEXT: 'devices',
        },
        invoke: {
          src: context => async send => {
            const pc = new RTCPeerConnection(context.initConfig.rtcConfiguration);
            pc.createDataChannel('');
            pc.onicecandidateerror = e => console.error(e);
            pc.onicegatheringstatechange = () => {
              if (pc.iceGatheringState === 'complete') {
                send({ type: 'NEXT' });
              }
            };
            pc.onicecandidate = e => {
              if (!e.candidate) {
                return;
              }
              const iceCandidateType = getIceCandidateType(e.candidate);
              if (iceCandidateType) {
                context.results.connectivity[iceCandidateType] = {
                  info: e.candidate,
                  success: true,
                  errorMessage: '',
                  id: e.candidate.candidate,
                };
              }
            };
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
          },
        },
      },
      devices: {
        invoke: {
          src: context => async send => {
            try {
              validateMediaDevicesExistence();
              context.results.devices.success = true;
              const camera = await checkCamera();
              context.results.devices.camera = { ...camera, id: 'camera' };
              const microphone = await checkMicrophone();
              context.results.devices.microphone = { ...microphone, id: 'microphone' };
              send({ type: 'STOP' });
            } catch (error) {
              context.results.devices.success = false;
              context.results.devices.errorMessage = (error as Error).message;
            }
          },
        },
      },
      stop: {
        type: 'final',
      },
    },
  });
