import { assign, createMachine, interpret, send } from 'xstate';
import { HMSConnectionRole } from '../connection/model';
import { HMSException } from '../error/HMSException';
import { TrackState } from '../notification-manager';
import { ISignal } from '../signal/ISignal';
import { API_DATA_CHANNEL } from '../utils/constants';

export const peerConnectionMachine = (config: RTCConfiguration, signal: ISignal) =>
  createMachine<{
    connection: RTCPeerConnection | null;
    candidates: Set<RTCIceCandidateInit>;
    trackStates: Map<string, TrackState>;
  }>({
    id: 'peerConnectionMachine',
    initial: 'init',
    context: {
      connection: null,
      candidates: new Set(),
      trackStates: new Map<string, TrackState>(),
    },
    on: {
      connected: 'connected',
      disconnected: 'disconnected',
      connecting: 'connecting',
      closed: 'closed',
      failed: 'failed',
      trickle: {
        actions: (context, event) => {
          if (!context.connection?.remoteDescription) {
            context.candidates.add(event.iceCandidate);
          } else {
            context.connection.addIceCandidate(event.iceCandidate);
          }
        },
      },
      join: 'join',
      negotiate: 'negotiate',
      publish: {
        actions: async (context, event) => {
          const { track } = event;
          track.publishedTrackId = track.getTrackIDBeingSent();
          context.trackStates.set(track.publishedTrackId, new TrackState(track));
          console.error('publish called');
          context.connection?.addTransceiver(track.nativeTrack, {
            streams: [track.stream.nativeStream],
            direction: 'sendonly',
            sendEncodings: [{ active: true }],
          });
        },
      },
    },
    states: {
      init: {
        invoke: {
          src: context => async send => {
            console.error({ config }, 'creating connection');
            context.connection = new RTCPeerConnection(config);
            context.connection.createDataChannel(API_DATA_CHANNEL, {
              protocol: 'SCTP',
            });
            context.connection.onconnectionstatechange = () => {
              console.error('connectionstate', context.connection?.connectionState);
              send({ type: context.connection?.connectionState! });
            };

            context.connection.onicecandidate = ({ candidate }) => {
              if (candidate) {
                console.error({ candidate });
                signal.trickle(HMSConnectionRole.Publish, candidate);
              }
            };
            send({ type: 'join' });
          },
          onError: {
            actions: (_, event) => {
              console.error('error', event.data);
            },
          },
        },
      },
      connecting: {},
      connected: {},
      disconnected: {
        invoke: {
          src: () => send => {
            const retryMachine = createRetryMachine(() => send({ type: 'negotiate', iceRestart: true }));
            const service = interpret(retryMachine).start();
            service.onDone(event => {
              console.error('retry done', event);
            });
          },
        },
      },
      failed: {
        invoke: {
          src: () => send => {
            const retryMachine = createRetryMachine(() => send({ type: 'negotiate', iceRestart: true }));
            const service = interpret(retryMachine).start();
            service.onDone(event => {
              console.error('retry done', event);
            });
          },
        },
      },
      join: {
        invoke: {
          src: context => async send => {
            if (!context.connection) {
              return;
            }
            const offer = await context.connection.createOffer();
            await context.connection.setLocalDescription(offer);
            const answer = await signal.join('ravi', '', true, true, true, offer);
            await context.connection.setRemoteDescription(answer);
            context.candidates.forEach(candidate => {
              context.connection?.addIceCandidate(candidate);
              context.candidates.delete(candidate);
            });
            console.error('join called');
            context.connection.onnegotiationneeded = () => {
              console.error('negotiation needed');
              send({ type: 'negotiate' });
            };
            send({ type: 'joined' });
          },
        },
      },
      negotiate: {
        invoke: {
          src: (context, event) => async () => {
            if (!context.connection) {
              console.error('publishNegotiation called');
              return;
            }
            console.error('publishNegotiation called');
            const offer = await context.connection.createOffer(event.iceRestart ? { iceRestart: true } : undefined);
            await context.connection.setLocalDescription(offer);
            const answer = await signal.offer(offer, context.trackStates);
            await context.connection.setRemoteDescription(answer);
          },
        },
      },
      closed: {
        entry: assign({
          connection: null,
          candidates: new Set(),
        }),
      },
    },
  });

interface RetryContext {
  retryCount: number;
  error: HMSException | null;
  success: boolean;
  maxRetries: number;
}

interface RetryEventObject {
  type: 'SCHEDULE';
  data?: HMSException;
}

export const createRetryMachine = (task: () => Promise<any> | any) =>
  createMachine<RetryContext, RetryEventObject>({
    id: 'retryMachine',
    initial: 'idle',
    context: {
      retryCount: 0,
      error: null,
      success: false,
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
          src: () => task(),
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
            { target: 'failed', cond: context => context.retryCount >= context.maxRetries },
          ],
        },
        entry: [
          assign<RetryContext, RetryEventObject>({
            success: false,
            error: (_, event) => {
              return event.data || null;
            },
            retryCount: context => context.retryCount + 1,
          }),
          send<RetryContext, RetryEventObject>(
            { type: 'SCHEDULE' },
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
