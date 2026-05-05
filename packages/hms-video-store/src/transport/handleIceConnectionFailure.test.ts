/**
 * `handleIceConnectionFailure` previously used the bare `role` value as a
 * conditional, but `HMSConnectionRole.Publish === 0` (falsy) — so the
 * in-progress check always inspected `SubscribeIceConnectionFailed`
 * regardless of which role had just failed.
 *
 * Real-world consequence:
 *   - Subscribe-side ICE failure is recovered by a passive wait (server
 *     re-sends an offer; client just answers).
 *   - Publish-side ICE failure must be recovered by the client itself
 *     issuing an iceRestart renegotiation.
 *   - When both sides fail at the same time (typical of network blips),
 *     the bug suppressed the publish restart because a subscribe
 *     passive-wait task was "in progress."
 *
 * Fixed by comparing `role === HMSConnectionRole.Publish` explicitly.
 */

import { TransportFailureCategory } from './models/TransportFailureCategory';
import HMSTransport from '.';
import { HMSConnectionRole } from '../connection/model';

describe('handleIceConnectionFailure', () => {
  // Build a minimal `this`-shaped object that has just what
  // `handleIceConnectionFailure` reads (retryScheduler). We bypass the
  // HMSTransport constructor to avoid wiring the full dependency graph;
  // the method only ever touches `this.retryScheduler`.
  const callHandler = (role: HMSConnectionRole, isTaskInProgressMock: (cat: TransportFailureCategory) => boolean) => {
    const scheduleSpy = jest.fn();
    const fakeThis = {
      retryScheduler: {
        isTaskInProgress: isTaskInProgressMock,
        schedule: scheduleSpy,
      },
      // Real fields the schedule call captures by reference; not used in checks.
      retryPublishIceFailedTask: () => Promise.resolve(true),
      retrySubscribeIceFailedTask: () => Promise.resolve(true),
    };
    const handler = (HMSTransport.prototype as any).handleIceConnectionFailure;
    return { promise: handler.call(fakeThis, role, new Error('ice failed')), scheduleSpy };
  };

  it('schedules publish retry when role=Publish (no other tasks in progress)', async () => {
    const { promise, scheduleSpy } = callHandler(HMSConnectionRole.Publish, () => false);
    await promise;

    expect(scheduleSpy).toHaveBeenCalledTimes(1);
    expect(scheduleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        category: TransportFailureCategory.PublishIceConnectionFailed,
      }),
    );
  });

  it('schedules subscribe wait when role=Subscribe (no other tasks in progress)', async () => {
    const { promise, scheduleSpy } = callHandler(HMSConnectionRole.Subscribe, () => false);
    await promise;

    expect(scheduleSpy).toHaveBeenCalledTimes(1);
    expect(scheduleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        category: TransportFailureCategory.SubscribeIceConnectionFailed,
      }),
    );
  });

  it('skips when role=Publish and a Publish retry is already in progress', async () => {
    const inProgress = (cat: TransportFailureCategory) => cat === TransportFailureCategory.PublishIceConnectionFailed;
    const { promise, scheduleSpy } = callHandler(HMSConnectionRole.Publish, inProgress);
    await promise;

    expect(scheduleSpy).not.toHaveBeenCalled();
  });

  it('skips when role=Subscribe and a Subscribe wait is already in progress', async () => {
    const inProgress = (cat: TransportFailureCategory) => cat === TransportFailureCategory.SubscribeIceConnectionFailed;
    const { promise, scheduleSpy } = callHandler(HMSConnectionRole.Subscribe, inProgress);
    await promise;

    expect(scheduleSpy).not.toHaveBeenCalled();
  });

  it('does NOT skip publish retry when only a Subscribe wait is in progress', async () => {
    const inProgress = (cat: TransportFailureCategory) => cat === TransportFailureCategory.SubscribeIceConnectionFailed;
    const { promise, scheduleSpy } = callHandler(HMSConnectionRole.Publish, inProgress);
    await promise;

    expect(scheduleSpy).toHaveBeenCalledTimes(1);
    expect(scheduleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        category: TransportFailureCategory.PublishIceConnectionFailed,
      }),
    );
  });

  // Symmetric case — we want to confirm the bug only bites Publish, not Subscribe.
  it('does NOT incorrectly skip subscribe wait when only a Publish retry is in progress', async () => {
    const inProgress = (cat: TransportFailureCategory) => cat === TransportFailureCategory.PublishIceConnectionFailed;
    const { promise, scheduleSpy } = callHandler(HMSConnectionRole.Subscribe, inProgress);
    await promise;

    expect(scheduleSpy).toHaveBeenCalledTimes(1);
    expect(scheduleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        category: TransportFailureCategory.SubscribeIceConnectionFailed,
      }),
    );
  });
});
