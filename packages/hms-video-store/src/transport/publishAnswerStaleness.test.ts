/**
 * A publish answer must only be applied to the offer it answers.
 *
 * Applying a stale one throws SetRemoteDescriptionFailed (4004), which ErrorFactory builds
 * with isTerminal=true, so RetryScheduler routes it to handleTerminalError → Failed →
 * HMSSdk.internalLeave(). The peer is ejected mid-call.
 *
 * The staleness key is connection identity + HMSConnection's localDescriptionEpoch, not
 * signalingState: setLocalDescription is legal in `have-local-offer` as well as `stable`
 * (W3C webrtc-pc, "set the RTCSessionDescription"), so a racer can replace our pending offer
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
import { HMSException } from '../error/HMSException';
import { EventBus } from '../events/EventBus';
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
  remoteDescription: RTCSessionDescriptionInit | null = null;
  applied: Array<{ answer: string; against: string | null }> = [];
  createOfferOptions: Array<RTCOfferOptions | undefined> = [];
  addedCandidates: RTCIceCandidateInit[] = [];
  transceivers: RTCRtpTransceiver[] = [];
  /** candidate string the native call rejects, as a TURN-config-dependent OperationError would */
  rejectCandidate: string | null = null;

  getTransceivers() {
    return this.transceivers;
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (candidate.candidate === this.rejectCandidate) {
      throw new Error('OperationError: could not parse candidate');
    }
    this.addedCandidates.push(candidate);
  }

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
      this.remoteDescription = description;
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

// jsdom has no MediaStream; HMSMediaStream's constructor only reads `id`
let streamCount = 0;
(global as unknown as { MediaStream: unknown }).MediaStream = function MediaStreamStub(this: { id: string }) {
  this.id = `native-stream-${++streamCount}`;
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
  eventBus: EventBus;
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
  return { t, connection, native, observer: observer as any, eventBus, discards };
};

const collectEvents = (eventBus: EventBus, name: string) => {
  const events: Array<Record<string, unknown>> = [];
  eventBus.analytics.subscribe(event => {
    if (event?.name === name) {
      events.push(event.properties);
    }
  });
  return events;
};

/** The smallest store/peer scaffolding handleSFUMigration walks before its republish loop. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stubMigrationStore = (t: any, localPeer: unknown) => {
  t.clearPeerConnections = jest.fn();
  // leave publishConnection as the harness one so the captured identity is observable
  t.createPeerConnections = jest.fn();
  t.store.getPeerMap = () => ({});
  t.store.removeRemoteTracks = jest.fn();
  t.store.removeTrack = jest.fn();
  t.store.getLocalPeer = () => localPeer;
  t.listener = { onSFUMigration: jest.fn() };
};

/** A local track the migration can clone and clean up. */
const makeMigratableTrack = (trackId: string, type: 'audio' | 'video') => {
  const track = {
    trackId,
    type,
    source: 'regular',
    stream: { id: `stream-${trackId}` },
    cleanup: jest.fn(),
    clone: jest.fn(() => ({ trackId: `${trackId}-clone`, type, source: 'regular' })),
  };
  return track;
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
        // the field exists so leave()-race discards can be excluded from the rollout gate
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

    // reported, never thrown: the role-update caller has no catch, and the migration caller's
    // catch would abandon the republish
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

    // 4004, not the internal 4008: HMSSdk.join's own catch rethrows this to the app's
    // onError, so it reports the error apps already handle. Terminal, else internalLeave's
    // join-in-progress wait spins forever.
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

  it('reconciles publish bookkeeping when a migration republish leaves the track staged', async () => {
    const { t, native } = makeHarness();
    const transceiver = {} as RTCRtpTransceiver;
    native.transceivers = [transceiver];
    const track: any = { trackId: 'v1', publishedTrackId: 'v1', isPublished: false, transceiver };
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

  /**
   * The gate reads the connection, not the error code: 4008 covers both "a racer's offer won"
   * (staged) and "publish connection is gone" (nothing staged), and a lost socket can leave the
   * track fully staged for the reconnect's re-offer.
   */
  it('reports a socket-loss republish as published when the transceiver is still staged', async () => {
    const { t, native } = makeHarness();
    const transceiver = {} as RTCRtpTransceiver;
    native.transceivers = [transceiver];
    const track: any = { trackId: 'v1', publishedTrackId: 'v1', isPublished: false, transceiver };
    t.trackStates = new Map([['v1', { track_id: 'v1' }]]);
    const addTrack = jest.fn();
    t.store.addTrack = addTrack;
    // the SFU may have applied the offer before the socket died, and the signal reconnect
    // re-offers trackStates either way — isPublished false would send removeTrack down cleanup()
    t.publishTrack = async () => {
      throw ErrorFactory.WebSocketConnectionErrors.WebSocketConnectionLost(HMSAction.PUBLISH, 'socket died');
    };

    await t.republishOnMigration(track);

    expect(addTrack).toHaveBeenCalledWith(track);
    expect(track.isPublished).toBe(true);
  });

  it('does not report a republish as published when the transceiver belongs to the old connection', async () => {
    const { t, native } = makeHarness();
    const transceiver = {} as RTCRtpTransceiver;
    // the transceiver is attached to the connection the migration replaced, not the live one
    native.transceivers = [transceiver];
    const replacement = makeConnection();
    t.publishConnection = replacement.connection;
    replacement.native.transceivers = [];
    const track: any = { trackId: 'v1', publishedTrackId: 'v1', isPublished: false, transceiver };
    t.trackStates = new Map([['v1', { track_id: 'v1' }]]);
    const addTrack = jest.fn();
    t.store.addTrack = addTrack;
    t.publishTrack = async () => {
      throw ErrorFactory.WebrtcErrors.PublishAnswerSuperseded(HMSAction.PUBLISH, 'connection_replaced');
    };

    await t.republishOnMigration(track);

    expect(addTrack).not.toHaveBeenCalled();
    expect(track.isPublished).toBe(false);
  });

  it('does not report a republish as published when trackStates no longer names the track', async () => {
    const { t, native } = makeHarness();
    const transceiver = {} as RTCRtpTransceiver;
    native.transceivers = [transceiver];
    const track: any = { trackId: 'v1', publishedTrackId: 'v1', isPublished: false, transceiver };
    // a concurrent unpublish dropped the trackState while the republish was in flight, so no
    // later offer carries it — the transceiver alone does not make it published
    t.trackStates = new Map();
    const addTrack = jest.fn();
    t.store.addTrack = addTrack;
    t.publishTrack = async () => {
      throw ErrorFactory.WebrtcErrors.PublishAnswerSuperseded(HMSAction.PUBLISH, 'superseded_offer');
    };

    await t.republishOnMigration(track);

    expect(addTrack).not.toHaveBeenCalled();
    expect(track.isPublished).toBe(false);
  });

  it('does not report a republish as published when nothing is staged on the live connection', async () => {
    const { t, native } = makeHarness();
    // the 4008 raised when publishConnection is gone shares its code with a superseded answer,
    // but the transceiver is on nobody's connection — claiming published is a lie
    native.transceivers = [];
    const track: any = { trackId: 'v1', publishedTrackId: 'v1', isPublished: false, transceiver: {} };
    t.trackStates = new Map([['v1', { track_id: 'v1' }]]);
    const addTrack = jest.fn();
    t.store.addTrack = addTrack;
    t.publishTrack = async () => {
      throw ErrorFactory.WebrtcErrors.PublishAnswerSuperseded(HMSAction.PUBLISH, 'publish connection is gone');
    };

    await t.republishOnMigration(track);

    expect(addTrack).not.toHaveBeenCalled();
    expect(track.isPublished).toBe(false);
  });

  /**
   * HMSTransport.handleLocalRoleUpdate awaits negotiateOnFirstPublish bare, and HMSSdk awaits that before
   * roleChangeManager.handleLocalPeerRoleUpdate. A throw there promotes a peer that never
   * captures or publishes, with no ROLE_UPDATED and nothing to recover it.
   */
  it('returns false instead of throwing when the connection was replaced under it', async () => {
    const { t, connection } = makeHarness();
    t.signal = makeSignal(async () => {
      // a second NodeInfo starts migration B: new connection, trackStates cleared
      t.publishConnection = makeConnection().connection;
      return answer('ans-1');
    });

    await expect(t.negotiateOnFirstPublish()).resolves.toBe(false);
    // initAfterJoin skipped: in prod clearPeerConnections already closed this one
    expect(connection.nativeConnection.onnegotiationneeded).toBeNull();
  });

  /**
   * The regression this branch shipped and then took back: a throw here escapes into
   * HMSSdk.handleLocalRoleUpdate, which awaits it before roleChangeManager and whiteboard, so
   * the promoted peer never captures or publishes and no ROLE_UPDATED fires.
   */
  describe.each([
    [
      'a racer staged a newer offer',
      (t: any, connection: HMSPublishConnection) => connection.setLocalDescription(offer('offer-2')),
    ],
    ['a migration replaced the connection', (t: any) => (t.publishConnection = makeConnection().connection)],
  ])('role promotion when %s', (_case, race) => {
    it('still finishes, so the caller reaches diffRolesAndPublishTracks', async () => {
      const { t, connection } = makeHarness();
      // the predicate short-circuits to true unless this flag is on, which would make the
      // promotion a no-op and the assertion vacuous
      t.isFlagEnabled = () => true;
      t.createPeerConnections = jest.fn();
      const negotiate = jest.spyOn(t, 'negotiateOnFirstPublish');
      t.signal = makeSignal(async () => {
        await race(t, connection);
        return answer('ans-1');
      });

      await expect(
        t.handleLocalRoleUpdate({
          oldRole: { publishParams: {}, subscribeParams: {} },
          newRole: { publishParams: { allowed: ['video'] }, subscribeParams: {} },
        }),
      ).resolves.toBeUndefined();

      expect(negotiate).toHaveBeenCalled();
    });
  });

  it('aborts the migration itself when a newer one replaced the connection mid-negotiation', async () => {
    const { t, connection } = makeHarness();
    const localPeer = { isLocal: true, audioTrack: undefined, videoTrack: undefined, auxiliaryTracks: [] };
    stubMigrationStore(t, localPeer);
    const republish = jest.fn();
    t.republishOnMigration = republish;
    t.negotiateOnFirstPublish = jest.fn(async () => {
      expect(t.publishConnection).toBe(connection);
      t.publishConnection = makeConnection().connection;
      return false;
    });

    await t.handleSFUMigration();

    // migration B owns the peer now — A must not republish onto it or announce a migration
    expect(republish).not.toHaveBeenCalled();
    expect(t.listener.onSFUMigration).not.toHaveBeenCalled();
  });

  /**
   * The positive control for every `not.toHaveBeenCalled` below: without this, deleting
   * onSFUMigration() outright would leave the whole migration suite green.
   */
  it('completes a clean migration: every track republished, onSFUMigration fired once', async () => {
    const { t, eventBus } = makeHarness();
    const incomplete = collectEvents(eventBus, 'sfuMigrationIncomplete');
    const localPeer: any = {
      isLocal: true,
      audioTrack: makeMigratableTrack('audio', 'audio'),
      videoTrack: makeMigratableTrack('video', 'video'),
      auxiliaryTracks: [makeMigratableTrack('aux', 'video')],
    };
    stubMigrationStore(t, localPeer);
    const published: string[] = [];
    t.negotiateOnFirstPublish = jest.fn(async () => true);
    t.republishOnMigration = jest.fn(async (track: { trackId: string }) => published.push(track.trackId));

    await t.handleSFUMigration();

    expect(published).toEqual(['audio-clone', 'video-clone', 'aux-clone']);
    expect(localPeer.auxiliaryTracks.map((track: { trackId: string }) => track.trackId)).toEqual(['aux-clone']);
    expect(t.listener.onSFUMigration).toHaveBeenCalledTimes(1);
    expect(incomplete).toHaveLength(0);
  });

  /**
   * Each republish is a full offer/answer round trip, so the check has to sit at every one of
   * them. Continuing past a republish that lost the connection attaches A's clones to B's
   * connection, overwrites the single RENEGOTIATION_CALLBACK_ID slot B awaits, and clobbers
   * B's auxiliaryTracks. Table-driven so a deleted checkpoint cannot hide behind its siblings.
   */
  describe.each([
    ['negotiate', 0, []],
    ['audio', 1, ['audio-clone']],
    ['video', 2, ['audio-clone', 'video-clone']],
    ['aux', 3, ['audio-clone', 'video-clone', 'aux-clone']],
  ])('aborts when a newer migration takes the connection during %s', (_stage, replaceAfter, expected) => {
    it('stops there and announces nothing', async () => {
      const { t } = makeHarness();
      const localPeer: any = {
        isLocal: true,
        audioTrack: makeMigratableTrack('audio', 'audio'),
        videoTrack: makeMigratableTrack('video', 'video'),
        auxiliaryTracks: [makeMigratableTrack('aux', 'video'), makeMigratableTrack('aux-2', 'video')],
      };
      stubMigrationStore(t, localPeer);
      const published: string[] = [];
      const takeConnection = () => {
        t.publishConnection = makeConnection().connection;
      };
      t.negotiateOnFirstPublish = jest.fn(async () => {
        if (replaceAfter === 0) {
          takeConnection();
        }
        return true;
      });
      t.republishOnMigration = jest.fn(async (track: { trackId: string }) => {
        published.push(track.trackId);
        if (published.length === replaceAfter) {
          takeConnection();
        }
      });

      await t.handleSFUMigration();

      expect(published).toEqual(expected);
      expect(t.listener.onSFUMigration).not.toHaveBeenCalled();
    });
  });

  it('hands the already-cloned aux tracks back when the loop aborts', async () => {
    const { t } = makeHarness();
    const remaining = makeMigratableTrack('aux-2', 'video');
    const localPeer: any = {
      isLocal: true,
      audioTrack: undefined,
      videoTrack: undefined,
      auxiliaryTracks: [makeMigratableTrack('aux-1', 'video'), remaining],
    };
    stubMigrationStore(t, localPeer);
    t.negotiateOnFirstPublish = jest.fn(async () => true);
    t.republishOnMigration = jest.fn(async () => {
      t.publishConnection = makeConnection().connection;
    });

    await t.handleSFUMigration();

    // the originals are already cleaned up, so dropping the clones loses the screenshare for good
    expect(localPeer.auxiliaryTracks.map((track: { trackId: string }) => track.trackId)).toEqual([
      'aux-1-clone',
      'aux-2',
    ]);
  });

  it('counts a genuinely failed migration instead of logging it away as aborted', async () => {
    const { t, eventBus } = makeHarness();
    const incomplete = collectEvents(eventBus, 'sfuMigrationIncomplete');
    const publishFailed = collectEvents(eventBus, 'publish.failed');
    t.sfuNodeId = 'node-a';
    t.signal = { setSfuNodeId: jest.fn() };
    t.handleSFUMigration = async () => {
      throw ErrorFactory.WebrtcErrors.SetRemoteDescriptionFailed(HMSAction.PUBLISH, 'sfu rejected the offer');
    };

    t.setSFUNodeId('node-b');
    await Promise.resolve();
    await Promise.resolve();

    // without this the peer sits half-migrated behind a single warn line, unmeasurable
    expect(incomplete).toHaveLength(1);
    expect(incomplete[0]).toMatchObject({
      reason: 'failed',
      sfu_node_id: 'node-b',
      error_code: ErrorCodes.WebrtcErrors.SET_REMOTE_DESCRIPTION_FAILED,
    });
    // must not land in publish.failed — that counter already holds ordinary publish errors
    expect(publishFailed).toHaveLength(0);
  });

  it('counts a superseded migration too — it abandons clones whose originals are gone', async () => {
    const { t, eventBus } = makeHarness();
    const incomplete = collectEvents(eventBus, 'sfuMigrationIncomplete');
    t.sfuNodeId = 'node-b';
    stubMigrationStore(t, { isLocal: true, audioTrack: undefined, videoTrack: undefined, auxiliaryTracks: [] });
    t.negotiateOnFirstPublish = jest.fn(async () => {
      t.publishConnection = makeConnection().connection;
      return false;
    });

    await t.handleSFUMigration();

    expect(incomplete).toEqual([{ reason: 'superseded', sfu_node_id: 'node-b' }]);
  });

  /**
   * onTrickle buffers into connection.candidates while remoteDescription is null, and the
   * publish connection never clears that list. negotiateOnFirstPublish's discard path returns
   * before its own drain, so the renegotiation that wins the race owns the flush — without it
   * every candidate trickled before the first answer is stranded and publish ICE can stall.
   */
  it('drains the pre-first-answer candidate buffer, exactly once', async () => {
    const { t, connection, native } = makeHarness();
    t.signal = makeSignal(async () => answer('ans-1'));
    connection.candidates.push({ candidate: 'c1' }, { candidate: 'c2' });

    const first = armWaiter(t, HMSAction.PUBLISH);
    await t.performPublishRenegotiation();
    await first.settled;

    expect(native.addedCandidates).toEqual([{ candidate: 'c1' }, { candidate: 'c2' }]);

    // a later renegotiation must not re-add them: onTrickle now goes straight to addIceCandidate
    const second = armWaiter(t, HMSAction.PUBLISH);
    await t.performPublishRenegotiation();
    await second.settled;

    expect(native.addedCandidates).toHaveLength(2);
  });

  /** the positive control for the join discard test: nothing else drives join's success path */
  it('applies the answer, drains the buffer and wires renegotiation on the join path', async () => {
    const { t, connection, native } = makeHarness();
    connection.candidates.push({ candidate: 'join-c1' }, { candidate: 'join-c2' });
    t.signal = {
      join: jest.fn(async () => answer('ans-1')),
      setSfuNodeId: jest.fn(),
      getPongResponseTimes: () => [],
    };
    t.initConfig = { config: {} };
    t.store.getUserAgent = () => '';

    await expect(t.negotiateJoinWebRTC({ name: 'n', data: '', autoSubscribeVideo: false })).resolves.toBe(true);

    expect(native.applied).toEqual([{ answer: 'ans-1', against: 'offer-1' }]);
    expect(native.addedCandidates).toEqual([{ candidate: 'join-c1' }, { candidate: 'join-c2' }]);
    expect(native.onnegotiationneeded).toEqual(expect.any(Function));
  });

  /** same, for the sibling every role promotion and every migration runs */
  it('applies the answer, drains the buffer and wires renegotiation on the first publish', async () => {
    const { t, connection, native } = makeHarness();
    connection.candidates.push({ candidate: 'role-c1' });
    t.signal = makeSignal(async () => answer('ans-1'));

    await expect(t.negotiateOnFirstPublish()).resolves.toBe(true);

    expect(native.applied).toEqual([{ answer: 'ans-1', against: 'offer-1' }]);
    expect(native.addedCandidates).toEqual([{ candidate: 'role-c1' }]);
    expect(native.onnegotiationneeded).toEqual(expect.any(Function));
  });

  it('passes a 421 through as success on the first publish, and rethrows anything else', async () => {
    const { t } = makeHarness();
    const serverError = new HMSException(421, 'ServerErrors', HMSAction.PUBLISH, 'wrong sfu node', '');

    // 421 means the offer reached the wrong node mid-migration; the migration re-drives
    expect(t.handleFirstPublishNegotiationError(serverError)).toBe(true);
    expect(() =>
      t.handleFirstPublishNegotiationError(ErrorFactory.WebrtcErrors.CreateOfferFailed(HMSAction.PUBLISH, 'boom')),
    ).toThrow();
    // a non-HMSException is a programming error and must not be swallowed as success
    expect(() => t.handleFirstPublishNegotiationError(new TypeError('undefined is not a function'))).toThrow(TypeError);
  });

  /**
   * An OperationError on one buffered candidate is routine with some TURN configs. The remote
   * description is already applied by then, so throwing would make publishTrack report a
   * failure for a track that is in fact published, and undo its own bookkeeping.
   */
  it('keeps draining, and keeps the negotiation successful, when one candidate is rejected', async () => {
    const { t, connection, native } = makeHarness();
    t.signal = makeSignal(async () => answer('ans-1'));
    connection.candidates.push({ candidate: 'bad' }, { candidate: 'good' });
    native.rejectCandidate = 'bad';

    const { outcome, settled } = armWaiter(t, HMSAction.PUBLISH);
    await t.performPublishRenegotiation();
    await settled;

    expect(native.addedCandidates).toEqual([{ candidate: 'good' }]);
    expect(native.applied).toEqual([{ answer: 'ans-1', against: 'offer-1' }]);
    expect(outcome.resolved).toBe(true);
    expect(outcome.rejected).toBeUndefined();
  });

  /**
   * Before the discard guard, a rejection at `await p` skipped teardown entirely. The guard put
   * it in a `finally`, which also ran it on the rethrow — stopping the camera and dropping the
   * track from the store while the caller aborted before TRACK_REMOVED / localPeer cleanup.
   */
  it('leaves the track intact when the unpublish fails for a reason other than a discard', async () => {
    const { t } = makeHarness();
    const track: any = {
      trackId: 'v1',
      publishedTrackId: 'v1',
      type: 'video',
      source: 'regular',
      stream: { removeSender: jest.fn() },
      cleanup: jest.fn(async () => undefined),
    };
    t.trackStates = new Map([['v1', { track_id: 'v1', type: 'video', source: 'regular' }]]);
    const removeTrack = jest.fn();
    t.store.removeTrack = removeTrack;
    setTimeout(() => {
      t.callbacks
        .get(RENEGOTIATION_CALLBACK_ID)
        .promise.reject(ErrorFactory.WebSocketConnectionErrors.WebSocketConnectionLost(HMSAction.UNPUBLISH, 'died'));
    }, 0);

    await expect(t.unpublishTrack(track)).rejects.toMatchObject({
      code: ErrorCodes.WebSocketConnectionErrors.WEBSOCKET_CONNECTION_LOST,
    });
    // the caller aborts before its own bookkeeping, so we must not have torn the track down
    expect(track.cleanup).not.toHaveBeenCalled();
    expect(removeTrack).not.toHaveBeenCalled();
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
