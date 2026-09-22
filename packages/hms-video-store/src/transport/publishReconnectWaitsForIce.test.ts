/**
 * "You are online" must mean media can flow, not that the websocket is back.
 *
 * retryPublishIceFailedTask awaited the ICE-restart offer/answer and then hit a bare
 * `return true`. performPublishRenegotiation resolves its waiter right after
 * setRemoteDescription, and an ICE restart has only re-started gathering at that point - the
 * transport is not usable yet. RetryScheduler took that as success, deleted the in-progress
 * marker and called onStateChange(Joined), which sdk/index.ts turns into onReconnected().
 *
 * Two things follow. The app says online while no video is publishing. And because the
 * in-progress marker is gone, handleIceConnectionFailure no longer early-returns, so the next
 * disconnect timer schedules a fresh retry and emits another publish.failed (4006) - the
 * "reconnecting" that shows up seconds after "you are online".
 *
 * Repro: join, let both sides see video, turn wifi off, turn it back on.
 */

import HMSTransport from '.';
import { makeTransport } from '../test/helpers/makeTransport';
import { PUBLISH_ICE_RECONNECT_TIMEOUT, RENEGOTIATION_CALLBACK_ID } from '../utils/constants';

/** a transport whose publish connection is in `state`, with the SDP exchange stubbed out */
const makeRecovering = (state: RTCPeerConnectionState) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = makeTransport().transport as any;
  t.publishConnection = {
    connectionState: state,
    handleSelectedIceCandidatePairs: jest.fn(),
    close: jest.fn(),
  };
  t.subscribeConnection = { close: jest.fn() };
  t.connectivityListener = { onICESuccess: jest.fn() };
  t.handleIceConnectionFailure = jest.fn();
  // the ICE-restart offer/answer completes; ICE itself has not reconnected
  t.performPublishRenegotiation = jest.fn(async () => {
    t.callbacks.get(RENEGOTIATION_CALLBACK_ID)?.promise.resolve(true);
  });
  return t;
};

/** lets queued microtasks run so a resolved task would have settled by now */
const flush = async () => {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
};

describe('publish reconnect waits for ICE, not just the offer/answer', () => {
  it('does not report success while the restarted transport is still connecting', async () => {
    const t = makeRecovering('disconnected');
    let settled = false;

    const task = t.retryPublishIceFailedTask().then((ok: boolean) => {
      settled = true;
      return ok;
    });
    await flush();

    // the SDP exchange is done, so the old code has already returned true here
    expect(t.performPublishRenegotiation).toHaveBeenCalledWith({ iceRestart: true });
    expect(settled).toBe(false);

    t.publishConnection.connectionState = 'connected';
    await t.handlePublishConnectionStateChange('connected');

    await expect(task).resolves.toBe(true);
  });

  it('reports failure when the restarted transport fails, so the scheduler retries', async () => {
    const t = makeRecovering('disconnected');

    const task = t.retryPublishIceFailedTask();
    await flush();

    t.publishConnection.connectionState = 'failed';
    await t.handlePublishConnectionStateChange('failed');

    await expect(task).resolves.toBe(false);
  });

  it('does not wait when the transport is already connected, since no ICE restart is asked for', async () => {
    const t = makeRecovering('connected');

    await expect(t.retryPublishIceFailedTask()).resolves.toBe(true);

    // the re-offer still happens: the previous offer may have failed and left tiles missing
    expect(t.performPublishRenegotiation).toHaveBeenCalledWith({ iceRestart: false });
  });

  /**
   * No ICE restart is asked for when the transport is up at entry, but it can still drop during
   * the re-offer. Reporting success there re-creates the double cycle the wait exists to remove.
   */
  it('waits when a connected transport drops during the re-offer', async () => {
    const t = makeRecovering('connected');
    t.performPublishRenegotiation = jest.fn(async () => {
      t.publishConnection.connectionState = 'disconnected';
      t.callbacks.get(RENEGOTIATION_CALLBACK_ID)?.promise.resolve(true);
    });
    let settled = false;

    const task = t.retryPublishIceFailedTask().then((ok: boolean) => {
      settled = true;
      return ok;
    });
    await flush();

    expect(settled).toBe(false);

    t.publishConnection.connectionState = 'connected';
    await t.handlePublishConnectionStateChange('connected');

    await expect(task).resolves.toBe(true);
  });

  it('gives up at the backstop rather than holding the retry budget open forever', async () => {
    jest.useFakeTimers();
    try {
      const t = makeRecovering('disconnected');

      const task = t.retryPublishIceFailedTask();
      await flush();
      jest.advanceTimersByTime(PUBLISH_ICE_RECONNECT_TIMEOUT + 1000);

      await expect(task).resolves.toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('settles a pending waiter when the peer connections are torn down', async () => {
    const t = makeRecovering('disconnected');

    const task = t.retryPublishIceFailedTask();
    await flush();
    await t.clearPeerConnections();

    await expect(task).resolves.toBe(false);
  });
});

/** guards the assumption the whole file rests on: the task is reachable as an instance field */
it('exposes retryPublishIceFailedTask on the instance', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = makeTransport().transport as any;
  expect(typeof t.retryPublishIceFailedTask).toBe('function');
  expect((HMSTransport.prototype as unknown as Record<string, unknown>).retryPublishIceFailedTask).toBeUndefined();
});
