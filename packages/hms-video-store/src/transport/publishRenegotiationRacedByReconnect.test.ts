/**
 * A publish answer applied to a peer connection that is no longer waiting for one
 * throws SetRemoteDescriptionFailed (4004), which is terminal — RetryScheduler routes
 * it to handleTerminalError and the peer is dropped from the room. A transient network
 * blip therefore ends the session instead of recovering.
 *
 * Two routes reach it, both leaving the connection back at `stable` before our answer
 * lands:
 *   1. Concurrent renegotiation — `onRenegotiationNeeded` and `retryPublishIceFailedTask`
 *      both call performPublishRenegotiation, with nothing serialising them.
 *   2. Offer retried across a reconnect — `signal.offer` fails on a dead websocket with
 *      WebSocketConnectionLost (1003), which is in JsonRpcSignal.call's `shouldRetry`
 *      set, so it sleeps and re-sends. If the socket recovers inside that sleep, the
 *      reconnect completes its own negotiation first and our answer arrives stale.
 */

import HMSTransport from '.';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { RENEGOTIATION_CALLBACK_ID } from '../utils/constants';

/**
 * Models a real RTCPeerConnection's signalingState transitions closely enough to
 * trip the guard Chrome actually applies, and mirrors HMSConnection's wrapping of
 * the native DOMException into the terminal 4004.
 */
const makePublishConnection = () => {
  let signalingState: RTCSignalingState = 'stable';
  const appliedAnswers: string[] = [];
  return {
    appliedAnswers,
    get signalingState() {
      return signalingState;
    },
    connectionState: 'disconnected' as RTCPeerConnectionState,
    createOffer: jest.fn(async () => ({ type: 'offer', sdp: 'v=0 offer' })),
    setLocalDescription: jest.fn(async () => {
      signalingState = 'have-local-offer';
    }),
    setRemoteDescription: jest.fn(async (desc: RTCSessionDescriptionInit) => {
      if (signalingState !== 'have-local-offer') {
        throw ErrorFactory.WebrtcErrors.SetRemoteDescriptionFailed(
          HMSAction.PUBLISH,
          "Failed to execute 'setRemoteDescription' on 'RTCPeerConnection': " +
            'Failed to set remote answer sdp: Called in wrong state: stable',
        );
      }
      appliedAnswers.push(desc.sdp!);
      signalingState = 'stable';
    }),
  };
};

/**
 * Bypasses the HMSTransport constructor (which would need the full dependency graph)
 * while keeping the prototype, so performPublishRenegotiation reaches the real
 * applyPublishAnswer rather than a stub.
 */
const makeFakeTransport = (fields: Record<string, unknown>) =>
  Object.assign(Object.create(HMSTransport.prototype), fields);

const runRenegotiation = async (
  signalOffer: jest.Mock,
  publishConnection: ReturnType<typeof makePublishConnection> | null,
) => {
  const callbacks = new Map();
  let rejectedWith: any;
  let resolvedWith: any;

  const settled = new Promise((resolve, reject) => {
    callbacks.set(RENEGOTIATION_CALLBACK_ID, {
      promise: { resolve, reject },
      action: HMSAction.RESTART_ICE,
      extra: {},
    });
  }).then(
    v => {
      resolvedWith = v;
    },
    err => {
      rejectedWith = err;
    },
  );

  const fakeThis = makeFakeTransport({
    callbacks,
    publishConnection,
    trackStates: new Map(),
    signal: { offer: signalOffer },
  });

  await (HMSTransport.prototype as any).performPublishRenegotiation.call(fakeThis, { iceRestart: true });
  await settled;
  return { rejectedWith, resolvedWith };
};

describe('publish renegotiation raced by reconnect', () => {
  /**
   * Known gap, deliberately not closed here. setLocalDescription(offer) is legal in
   * `have-local-offer` as well as `stable`, so a competing negotiation can replace our
   * pending offer without the state ever leaving `have-local-offer` — we then apply our
   * answer against their offer and Chrome reports an m-line mismatch. Detecting that
   * needs offer identity, and sdp comparison is unsafe because createOffer munges
   * (fixMsid + enableOpusDtx) and Chrome is not guaranteed to store it byte-identically.
   * This is a much rarer signature than `wrong state: stable`; measure before fixing.
   */
  it.todo('discards an answer superseded by a pending offer (needs offer identity, not state)');

  it('discards the stale answer when a concurrent negotiation already returned to stable', async () => {
    const publishConnection = makePublishConnection();

    // The competing negotiation completes while our offer is in flight, so the
    // connection is back at `stable` before our answer lands.
    const signalOffer = jest.fn(async () => {
      await publishConnection.setRemoteDescription({ type: 'answer', sdp: 'winner-answer' });
      expect(publishConnection.signalingState).toBe('stable');
      return { type: 'answer', sdp: 'stale-answer' };
    });

    const { rejectedWith, resolvedWith } = await runRenegotiation(signalOffer, publishConnection);

    // Previously this rejected with the terminal 4004 and the peer was dropped.
    expect(rejectedWith).toBeUndefined();
    expect(resolvedWith).toBe(true);
    expect(publishConnection.appliedAnswers).toEqual(['winner-answer']);
    expect(publishConnection.signalingState).toBe('stable');
  });

  it('still applies the answer on the happy path where nothing races the offer', async () => {
    const publishConnection = makePublishConnection();
    const signalOffer = jest.fn(async () => ({ type: 'answer', sdp: 'answer' }));

    const { rejectedWith, resolvedWith } = await runRenegotiation(signalOffer, publishConnection);

    expect(rejectedWith).toBeUndefined();
    expect(resolvedWith).toBe(true);
    expect(publishConnection.appliedAnswers).toEqual(['answer']);
    expect(publishConnection.signalingState).toBe('stable');
  });

  it('discards the answer when the peer connection is disposed mid-flight', async () => {
    const publishConnection = makePublishConnection();
    const signalOffer = jest.fn(async () => ({ type: 'answer', sdp: 'answer-after-dispose' }));

    const callbacks = new Map();
    let rejectedWith: any;
    let resolvedWith: any;
    const settled = new Promise((resolve, reject) => {
      callbacks.set(RENEGOTIATION_CALLBACK_ID, {
        promise: { resolve, reject },
        action: HMSAction.RESTART_ICE,
        extra: {},
      });
    }).then(
      v => {
        resolvedWith = v;
      },
      err => {
        rejectedWith = err;
      },
    );

    const fakeThis: any = makeFakeTransport({
      callbacks,
      publishConnection,
      trackStates: new Map(),
      signal: { offer: signalOffer },
    });
    signalOffer.mockImplementation(async () => {
      fakeThis.publishConnection = null; // leave()/reconnect tore the connection down
      return { type: 'answer', sdp: 'answer-after-dispose' };
    });

    await (HMSTransport.prototype as any).performPublishRenegotiation.call(fakeThis, { iceRestart: true });
    await settled;

    expect(rejectedWith).toBeUndefined();
    expect(resolvedWith).toBe(true);
    expect(publishConnection.appliedAnswers).toEqual([]);
  });
});
