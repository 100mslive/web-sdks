/**
 * Bug 4 — `retrySignalDisconnectTask` accesses `this.joinParameters!.X`
 * synchronously when building the args to `internalConnect`. If `leave()`
 * runs while the retry task's setTimeout is queued (or while the task is
 * paused on an await), `joinParameters` becomes `undefined`, and the next
 * arg-evaluation hits `undefined.authToken` → TypeError.
 *
 * Even when no TypeError fires, the task continues into
 * `this.signal.trackUpdate(this.trackStates)` and `internalConnect` after
 * leave has cleared state — issuing a doomed reconnect attempt with
 * stale data.
 *
 * This test calls `retrySignalDisconnectTask` directly with
 * `joinParameters = undefined` (the post-leave state). It must FAIL on
 * `main` (TypeError or unexpected internalConnect call) and PASS once
 * the task null-guards `joinParameters` / state at entry.
 */

import { makeTransport, TransportState } from '../../helpers/makeTransport';

describe('Bug 4 — retrySignalDisconnectTask vs leave() race', () => {
  it('does NOT call internalConnect or signal.trackUpdate when joinParameters is undefined (post-leave)', async () => {
    const { transport } = makeTransport();
    const t = transport as any;

    const internalConnectSpy = jest.fn(() => Promise.resolve({}));
    const trackUpdateSpy = jest.fn();

    // Replace methods/refs to simulate the exact post-leave state:
    //   - retryScheduler has fired the timeout, so we're now inside the task body
    //   - leave() has cleared joinParameters
    //   - signal.isConnected reflects "websocket already closed"
    t.joinParameters = undefined;
    t.state = TransportState.Leaving;
    t.internalConnect = internalConnectSpy;
    t.signal = {
      get isConnected() {
        return false;
      },
      trackUpdate: trackUpdateSpy,
    };

    let caught: unknown = undefined;
    try {
      await t.retrySignalDisconnectTask();
    } catch (e) {
      caught = e;
    }

    // On `main` this throws TypeError ("Cannot read properties of undefined (reading 'authToken')")
    // because `this.joinParameters!.authToken` dereferences undefined.
    // After the fix the task early-returns; no throw, no internalConnect, no trackUpdate.
    expect(caught).toBeUndefined();
    expect(internalConnectSpy).not.toHaveBeenCalled();
    expect(trackUpdateSpy).not.toHaveBeenCalled();
  });
});
