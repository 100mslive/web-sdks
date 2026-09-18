/**
 * A publish answer must only be applied to the offer it answers.
 *
 * Applying a stale one throws SetRemoteDescriptionFailed (4004), which ErrorFactory builds
 * with isTerminal=true, so RetryScheduler routes it to handleTerminalError → Failed →
 * HMSSDKActions.leave(). The peer is ejected mid-call.
 *
 * The staleness key is connection identity + HMSConnection's localDescriptionEpoch, not
 * signalingState: setLocalDescription is legal in `have-local-offer` as well as `stable`
 * (W3C webrtc-pc 4.3.2), so a racer can replace our pending offer without the state moving,
 * and handleSFUMigration can replace the connection object while the field stays non-null.
 *
 * The fake native RTCPeerConnection below models the W3C operations chain (a serial queue)
 * so "a racer entered setLocalDescription but it has not resolved yet" is expressible — that
 * interleaving is what forces the epoch to be bumped on entry rather than on resolution.
 */

import { TransportFailureCategory } from './models/TransportFailureCategory';
import HMSPublishConnection from '../connection/publish/publishConnection';
import { ErrorCodes } from '../error/ErrorCodes';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { makeTransport, TransportState } from '../test/helpers/makeTransport';
import { RENEGOTIATION_CALLBACK_ID } from '../utils/constants';

class FakeNativePeerConnection {
  signalingState: RTCSignalingState = 'stable';
  connectionState: RTCPeerConnectionState = 'connected';
  iceConnectionState: RTCIceConnectionState = 'connected';
  sctp: unknown = undefined;
  onicecandidate: unknown = null;
  oniceconnectionstatechange: unknown = null;
  onconnectionstatechange: unknown = null;
  onnegotiationneeded: unknown = null;

  /** sdp of the local offer currently staged — what an incoming answer is applied against */
  pendingLocalSdp: string | null = null;
  applied: Array<{ answer: string; against: string | null }> = [];
  createOfferOptions: Array<RTCOfferOptions | undefined> = [];

  private chain: Promise<unknown> = Promise.resolve();
  private offerCount = 0;
  private gate: Promise<void> | null = null;
  private openGate: (() => void) | null = null;

  createDataChannel() {
    return { close: () => undefined, onerror: null };
  }

  close() {
    this.signalingState = 'closed';
  }

  async createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> {
    this.createOfferOptions.push(options);
    this.offerCount += 1;
    return { type: 'offer', sdp: `offer-${this.offerCount}` };
  }

  /** holds every subsequently queued operation until releaseOperations() */
  holdOperations() {
    this.gate = new Promise<void>(resolve => {
      this.openGate = resolve;
    });
  }

  releaseOperations() {
    this.openGate?.();
    this.gate = null;
    this.openGate = null;
  }

  setLocalDescription(description: RTCSessionDescriptionInit) {
    return this.enqueue(() => {
      this.pendingLocalSdp = description.sdp ?? null;
      this.signalingState = 'have-local-offer';
    });
  }

  setRemoteDescription(description: RTCSessionDescriptionInit) {
    return this.enqueue(() => {
      if (this.signalingState !== 'have-local-offer') {
        throw new Error(
          "Failed to execute 'setRemoteDescription' on 'RTCPeerConnection': " +
            `Failed to set remote answer sdp: Called in wrong state: ${this.signalingState}`,
        );
      }
      this.applied.push({ answer: description.sdp!, against: this.pendingLocalSdp });
      this.pendingLocalSdp = null;
      this.signalingState = 'stable';
    });
  }

  private enqueue<T>(op: () => T): Promise<T> {
    const gate = this.gate;
    const run = this.chain.then(async () => {
      if (gate) {
        await gate;
      }
      return op();
    });
    this.chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }
}

let lastNative: FakeNativePeerConnection;
// HMSPublishConnection does `new RTCPeerConnection(config)`; a function returning an object
// stands in for the constructor, so the tests exercise the real HMSConnection wrapper.
(global as unknown as { RTCPeerConnection: unknown }).RTCPeerConnection = function RTCPeerConnectionStub() {
  lastNative = new FakeNativePeerConnection();
  return lastNative;
};

const makeConnection = () => {
  const signal = { trickle: jest.fn() };
  const observer = {
    onIceCandidate: jest.fn(),
    onIceConnectionChange: jest.fn(),
    onConnectionStateChange: jest.fn(),
    onDTLSTransportStateChange: jest.fn(),
    onDTLSTransportError: jest.fn(),
    onSelectedCandidatePairChange: jest.fn(),
    onRenegotiationNeeded: jest.fn(),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connection = new HMSPublishConnection(signal as any, {}, observer as any);
  return { connection, native: lastNative };
};

interface Harness {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  connection: HMSPublishConnection;
  native: FakeNativePeerConnection;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  observer: any;
  discards: Array<Record<string, unknown>>;
}

const makeHarness = (): Harness => {
  const { transport, observer, eventBus } = makeTransport();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = transport as any;
  const { connection, native } = makeConnection();
  t.publishConnection = connection;
  t.trackStates = new Map();

  const discards: Array<Record<string, unknown>> = [];
  eventBus.analytics.subscribe(event => {
    if (event?.name === 'publishAnswerDiscarded') {
      discards.push(event.properties);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { t, connection, native, observer: observer as any, discards };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const armWaiter = (t: any, action: HMSAction) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outcome: { resolved?: boolean; rejected?: any } = {};
  const owner = { promise: { resolve: () => undefined, reject: () => undefined }, action, extra: {} };
  const settled = new Promise<boolean>((resolve, reject) => {
    owner.promise = { resolve, reject } as never;
    t.callbacks.set(RENEGOTIATION_CALLBACK_ID, owner);
  }).then(
    value => {
      outcome.resolved = value;
    },
    error => {
      outcome.rejected = error;
    },
  );
  return { outcome, settled, owner };
};

/** the two signal methods this flow reaches: OFFER, and the pong times the analytics payload reads */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeSignal = (offerImpl: (...args: any[]) => Promise<RTCSessionDescriptionInit>) => ({
  offer: jest.fn(offerImpl),
  getPongResponseTimes: () => [],
});

const answer = (sdp: string): RTCSessionDescriptionInit => ({ type: 'answer', sdp });
const offer = (sdp: string): RTCSessionDescriptionInit => ({ type: 'offer', sdp });

describe('publish answer staleness', () => {
  it('applies the answer and resolves the waiter on the healthy path', async () => {
    const { t, native, discards } = makeHarness();
    t.signal = makeSignal(async () => answer('ans-1'));
    const { outcome, settled } = armWaiter(t, HMSAction.RESTART_ICE);

    await t.performPublishRenegotiation({ iceRestart: true });
    await settled;

    expect(native.applied).toEqual([{ answer: 'ans-1', against: 'offer-1' }]);
    expect(outcome.resolved).toBe(true);
    expect(discards).toHaveLength(0);
    expect(t.callbacks.has(RENEGOTIATION_CALLBACK_ID)).toBe(false);
  });

  it('discards and rejects NON-terminally when a racer completed a negotiation (state back to stable)', async () => {
    const { t, connection, native, discards } = makeHarness();
    t.signal = makeSignal(async () => {
      await connection.setLocalDescription(offer('offer-2'));
      await connection.setRemoteDescription(answer('racer-ans'));
      return answer('ans-1');
    });
    const { outcome, settled } = armWaiter(t, HMSAction.RESTART_ICE);

    await t.performPublishRenegotiation({ iceRestart: true });
    await settled;

    // our answer never reached the connection; only the racer's did
    expect(native.applied).toEqual([{ answer: 'racer-ans', against: 'offer-2' }]);
    expect(outcome.resolved).toBeUndefined();
    expect(outcome.rejected.code).toBe(ErrorCodes.WebrtcErrors.PUBLISH_ANSWER_SUPERSEDED);
    // the whole point: NOT terminal, so RetryScheduler retries instead of ejecting
    expect(outcome.rejected.isTerminal).toBe(false);
    expect(discards).toEqual([
      {
        reason: 'superseded_offer',
        action: HMSAction.RESTART_ICE.toString(),
        signaling_state: 'stable',
        // needed to exclude the benign leave()-race discards from the rollout gate
        transport_state: 'Disconnected',
        epoch: 1,
      },
    ]);
  });

  it('discards when a racer replaced our pending offer and the state never left have-local-offer', async () => {
    const { t, connection, native, discards } = makeHarness();
    t.signal = makeSignal(async () => {
      await connection.setLocalDescription(offer('offer-2'));
      return answer('ans-1');
    });
    const { outcome, settled } = armWaiter(t, HMSAction.PUBLISH);

    await t.performPublishRenegotiation();
    await settled;

    // a signalingState guard passes here and applies ans-1 against offer-2 (m-line mismatch)
    expect(native.signalingState).toBe('have-local-offer');
    expect(native.applied).toEqual([]);
    expect(native.pendingLocalSdp).toBe('offer-2');
    expect(outcome.rejected.code).toBe(ErrorCodes.WebrtcErrors.PUBLISH_ANSWER_SUPERSEDED);
    expect(discards[0]).toMatchObject({ reason: 'superseded_offer', signaling_state: 'have-local-offer' });
  });

  it('discards when a racer has only ENTERED setLocalDescription (still queued, unresolved)', async () => {
    const { t, connection, native, discards } = makeHarness();
    t.signal = makeSignal(async () => {
      native.holdOperations();
      // queued ahead of any setRemoteDescription we could issue, but not yet resolved
      void connection.setLocalDescription(offer('offer-2'));
      return answer('ans-1');
    });
    const { outcome, settled } = armWaiter(t, HMSAction.PUBLISH);

    await t.performPublishRenegotiation();
    native.releaseOperations();
    await settled;

    // nothing observable had changed yet: state and the staged sdp are still ours
    expect(native.applied).toEqual([]);
    expect(outcome.rejected.code).toBe(ErrorCodes.WebrtcErrors.PUBLISH_ANSWER_SUPERSEDED);
    expect(discards[0]).toMatchObject({ reason: 'superseded_offer' });
  });

  it('discards on connection identity when SFU migration replaced the publish connection', async () => {
    const { t, native, discards } = makeHarness();
    const replacement = makeConnection();
    t.signal = makeSignal(async () => {
      t.publishConnection = replacement.connection;
      return answer('ans-1');
    });
    const { outcome, settled } = armWaiter(t, HMSAction.PUBLISH);

    await t.performPublishRenegotiation();
    await settled;

    // the epoch alone cannot see this: a fresh connection restarts its own counter at 1
    const replacementEpoch = await replacement.connection.setLocalDescription(offer('new-offer-1'));
    expect(replacementEpoch).toBe(1);
    expect(replacement.native.applied).toEqual([]);
    expect(native.applied).toEqual([]);
    expect(outcome.rejected.code).toBe(ErrorCodes.WebrtcErrors.PUBLISH_ANSWER_SUPERSEDED);
    expect(discards[0]).toMatchObject({ reason: 'connection_replaced' });
  });

  it('does not strand a newer waiter that armed itself mid-flight', async () => {
    const { t } = makeHarness();
    let newer: unknown;
    t.signal = makeSignal(async () => {
      // a concurrent publishTrack overwrites the map entry while our OFFER rpc is in flight
      newer = { promise: { resolve: jest.fn(), reject: jest.fn() }, action: HMSAction.PUBLISH, extra: {} };
      t.callbacks.set(RENEGOTIATION_CALLBACK_ID, newer);
      return answer('ans-1');
    });
    const { settled } = armWaiter(t, HMSAction.RESTART_ICE);

    await t.performPublishRenegotiation();
    await settled;

    expect(t.callbacks.get(RENEGOTIATION_CALLBACK_ID)).toBe(newer);
  });

  it('guards the negotiateOnFirstPublish sibling the same way', async () => {
    const { t, connection, native, discards } = makeHarness();
    t.signal = makeSignal(async () => {
      await connection.setLocalDescription(offer('offer-2'));
      return answer('ans-1');
    });

    // reported, never thrown — neither caller catches (see the wiring test below)
    await expect(t.negotiateOnFirstPublish()).resolves.toBe(false);
    expect(native.applied).toEqual([]);
    expect(discards[0]).toMatchObject({ reason: 'superseded_offer', action: HMSAction.PUBLISH.toString() });
  });

  it('recovers the peer instead of ejecting it: RetryScheduler retries and never reaches Failed', async () => {
    const { t, connection, native, observer } = makeHarness();
    native.connectionState = 'failed';

    let attempt = 0;
    t.signal = makeSignal(async () => {
      attempt += 1;
      if (attempt === 1) {
        // the reconnect's own renegotiation lands while our OFFER rpc is in flight
        await connection.setLocalDescription(offer('racer-offer'));
        await connection.setRemoteDescription(answer('racer-ans'));
      }
      return answer(`ans-${attempt}`);
    });

    // exactly what handleIceConnectionFailure schedules, awaited so the recursion is observable
    await t.retryScheduler.schedule({
      category: TransportFailureCategory.PublishIceConnectionFailed,
      error: ErrorFactory.WebrtcErrors.ICEFailure(HMSAction.PUBLISH),
      task: t.retryPublishIceFailedTask,
      originalState: TransportState.Joined,
    });

    const states = observer.onStateChange.mock.calls.map((call: unknown[]) => call[0]);
    expect(states).not.toContain(TransportState.Failed);
    expect(states[states.length - 1]).toBe(TransportState.Joined);
    expect(attempt).toBe(2);
    expect(native.applied).toContainEqual({ answer: 'ans-2', against: 'offer-2' });
    // every offer must carry the caller's iceRestart — dropping it makes onReconnected a lie
    expect(native.createOfferOptions).toEqual([{ iceRestart: true }, { iceRestart: true }]);
  });

  /**
   * sdk's internalLeave spins on `isJoinInProgress && !error.isTerminal`, and join's finally
   * cannot run from inside transport.join's catch. A non-terminal discard escaping the join
   * path therefore hangs the tab at 10Hz forever instead of ejecting.
   */
  it('keeps the discard TERMINAL on the join path so internalLeave cannot spin forever', async () => {
    const { t, connection, native } = makeHarness();
    t.signal = {
      join: jest.fn(async () => {
        await connection.setLocalDescription(offer('offer-2'));
        return answer('ans-1');
      }),
      setSfuNodeId: jest.fn(),
      getPongResponseTimes: () => [],
    };
    t.initConfig = { config: {} };
    t.store.getUserAgent = () => '';

    // 4004, not the internal 4008: join is the only path that reaches the app's onError
    // (onStateChange(Failed) -> leave event -> handlePreviewError), so it reports the error
    // apps already handle. Terminal, else internalLeave's join-in-progress wait spins forever.
    await expect(t.negotiateJoinWebRTC({ name: 'n', data: '', autoSubscribeVideo: false })).rejects.toMatchObject({
      code: ErrorCodes.WebrtcErrors.SET_REMOTE_DESCRIPTION_FAILED,
      isTerminal: true,
    });
    expect(native.applied).toEqual([]);
  });

  it('settles the waiter when the publish connection is gone, instead of awaiting forever', async () => {
    const { t } = makeHarness();
    t.publishConnection = null;
    const { outcome, settled } = armWaiter(t, HMSAction.PUBLISH);

    await t.performPublishRenegotiation();
    await settled;

    expect(outcome.rejected.code).toBe(ErrorCodes.WebrtcErrors.PUBLISH_ANSWER_SUPERSEDED);
    expect(t.callbacks.get(RENEGOTIATION_CALLBACK_ID)).toBeUndefined();
  });

  it('still syncs track state to biz when the reconnect renegotiation throws', async () => {
    const { t } = makeHarness();
    t.joinParameters = { authToken: 'a', endpoint: 'e', peerId: 'p' };
    t.store.getRoom = () => ({ joinedAt: new Date(1) });
    const trackUpdate = jest.fn();
    t.signal = { isConnected: true, trackUpdate, getPongResponseTimes: () => [] };
    t.retryPublishIceFailedTask = async () => {
      throw ErrorFactory.WebrtcErrors.PublishAnswerSuperseded(HMSAction.RESTART_ICE, 'superseded_offer');
    };

    await expect(t.retrySignalDisconnectTask()).rejects.toBeDefined();
    // mutes made during the disconnect would otherwise never reach biz
    expect(trackUpdate).toHaveBeenCalledTimes(1);
  });

  it('keeps republishing the remaining tracks when one migration republish fails', async () => {
    const { t } = makeHarness();
    const published: string[] = [];
    t.publishTrack = jest.fn(async (track: { trackId: string }) => {
      published.push(track.trackId);
      if (track.trackId === 'audio') {
        throw ErrorFactory.WebrtcErrors.PublishAnswerSuperseded(HMSAction.PUBLISH, 'superseded_offer');
      }
    });

    await t.republishOnMigration({ trackId: 'audio', publishedTrackId: undefined });
    await t.republishOnMigration({ trackId: 'video', publishedTrackId: undefined });

    expect(published).toEqual(['audio', 'video']);
  });

  it('tears down and lets the caller finish its bookkeeping when unpublish loses the race', async () => {
    const { t } = makeHarness();
    const track: any = {
      trackId: 'aux-1',
      publishedTrackId: 'aux-1',
      type: 'video',
      source: 'screen',
      stream: { removeSender: jest.fn() },
      cleanup: jest.fn(async () => undefined),
    };
    t.trackStates = new Map([['aux-1', { track_id: 'aux-1', type: 'video', source: 'screen' }]]);
    t.screenStream = new Set();
    const removeTrack = jest.fn();
    t.store.removeTrack = removeTrack;
    // the renegotiation the unpublish is waiting on loses the epoch race
    setTimeout(() => {
      t.callbacks
        .get(RENEGOTIATION_CALLBACK_ID)
        .promise.reject(ErrorFactory.WebrtcErrors.PublishAnswerSuperseded(HMSAction.UNPUBLISH, 'superseded_offer'));
    }, 0);

    // must NOT reject: HMSSdk.removeTrack aborts before splice()/TRACK_REMOVED on a throw
    await expect(t.unpublishTrack(track)).resolves.toBeUndefined();
    expect(track.cleanup).toHaveBeenCalled();
    expect(removeTrack).toHaveBeenCalledWith(track);
  });

  it('finishes teardown even when track.cleanup rejects', async () => {
    const { t } = makeHarness();
    const track: any = {
      trackId: 'aux-2',
      publishedTrackId: 'aux-2',
      type: 'video',
      source: 'screen',
      stream: { removeSender: jest.fn() },
      cleanup: jest.fn(async () => {
        throw new Error('processor teardown blew up');
      }),
    };
    t.trackStates = new Map([['aux-2', { track_id: 'aux-2', type: 'video', source: 'screen' }]]);
    const stopped = jest.fn();
    t.screenStream = new Set([{ getTracks: () => [{ stop: stopped }] }]);
    const removeTrack = jest.fn();
    t.store.removeTrack = removeTrack;
    setTimeout(() => t.callbacks.get(RENEGOTIATION_CALLBACK_ID).promise.resolve(true), 0);

    await t.unpublishTrack(track);

    // the screenshare banner stop and the store removal must not be skipped
    expect(stopped).toHaveBeenCalled();
    expect(removeTrack).toHaveBeenCalledWith(track);
  });

  it('wires renegotiation and returns false when negotiateOnFirstPublish is superseded', async () => {
    const { t, connection, native } = makeHarness();
    t.signal = makeSignal(async () => {
      await connection.setLocalDescription(offer('offer-2'));
      return answer('ans-1');
    });

    // neither caller catches, so it must not throw
    await expect(t.negotiateOnFirstPublish()).resolves.toBe(false);
    expect(native.applied).toEqual([]);
    // without this every later publishTrack awaits RENEGOTIATION_CALLBACK_ID forever
    expect(native.onnegotiationneeded).toEqual(expect.any(Function));
  });

  it('reconciles publish bookkeeping when a migration republish is superseded', async () => {
    const { t } = makeHarness();
    const track: any = { trackId: 'v1', publishedTrackId: 'v1', isPublished: false };
    t.trackStates = new Map([['v1', { track_id: 'v1' }]]);
    const addTrack = jest.fn();
    t.store.addTrack = addTrack;
    t.publishTrack = async () => {
      throw ErrorFactory.WebrtcErrors.PublishAnswerSuperseded(HMSAction.PUBLISH, 'superseded_offer');
    };

    await t.republishOnMigration(track);

    // else a later removeTrack takes the cleanup() branch and the SFU keeps receiving it
    expect(addTrack).toHaveBeenCalledWith(track);
    expect(track.isPublished).toBe(true);
  });

  it('aborts rather than continuing when the connection was replaced under negotiateOnFirstPublish', async () => {
    const { t, connection } = makeHarness();
    t.signal = makeSignal(async () => {
      // a second NodeInfo starts migration B: new connection, trackStates cleared
      t.publishConnection = makeConnection().connection;
      return answer('ans-1');
    });

    // must THROW, not return false: handleSFUMigration ignores the return value, so migration A
    // would walk its republish loop against B's connection and duplicate B's transceivers
    await expect(t.negotiateOnFirstPublish()).rejects.toMatchObject({
      code: ErrorCodes.WebrtcErrors.PUBLISH_ANSWER_SUPERSEDED,
    });
    expect(connection.nativeConnection.onnegotiationneeded).toBeNull();
  });

  it('does not report a genuinely failed migration republish as published', async () => {
    const { t } = makeHarness();
    const track: any = { trackId: 'v1', publishedTrackId: 'v1', isPublished: false };
    t.trackStates = new Map([['v1', { track_id: 'v1' }]]);
    const addTrack = jest.fn();
    t.store.addTrack = addTrack;
    // the offer never reached the SFU — nothing is staged, so claiming published is a lie
    t.publishTrack = async () => {
      throw ErrorFactory.WebSocketConnectionErrors.WebSocketConnectionLost(HMSAction.PUBLISH, 'socket died');
    };

    await t.republishOnMigration(track);

    expect(addTrack).not.toHaveBeenCalled();
    expect(track.isPublished).toBe(false);
  });

  it('backs off repeat publish-ICE retries so a lost race cannot spin OFFERs at RTT speed', () => {
    const { t } = makeHarness();
    const delayFor = (n: number) =>
      t.retryScheduler.getDelayForRetryCount(TransportFailureCategory.PublishIceConnectionFailed, n);

    // the genuine first ICE restart must stay immediate
    expect(delayFor(0)).toBe(0);
    expect(delayFor(1)).toBeGreaterThanOrEqual(1000);
    expect(delayFor(4)).toBeGreaterThanOrEqual(4000);
    expect(delayFor(9)).toBeLessThanOrEqual(5000);
  });
});
