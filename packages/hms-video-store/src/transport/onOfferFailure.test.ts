/**
 * `signalObserver.onOffer` is the subscribe-renegotiation entry point. Its
 * try block contains four awaited steps:
 *   1. setRemoteDescription(jsep)
 *   2. addIceCandidate(...) (per buffered candidate)
 *   3. createAnswer()
 *   4. setLocalDescription(answer)
 *
 * Any of those rejecting drops to the same catch. Pre-fix, the catch only
 * called `observer.onFailure(ex)` — that just emits to errorListener.onError
 * and does NOT trigger internalLeave or retryScheduler.reset, so transport's
 * local state stayed stale. The fix routes through
 * `observer.onStateChange(Failed, ex)` (matching the neighboring
 * onServerError handler), which in HMSSdk runs handleFailedState →
 * internalLeave + errorListener.onError. observer.onFailure is dropped
 * because handleFailedState already invokes errorListener.onError.
 *
 * These tests pin all four failure points so a future revert can't slip
 * any of them past CI.
 */

import { makeTransport, TransportState } from '../test/helpers/makeTransport';

type AnySubConn = {
  sfuNodeId: string | undefined;
  candidates: any[];
  setRemoteDescription: jest.Mock;
  addIceCandidate: jest.Mock;
  createAnswer: jest.Mock;
  setLocalDescription: jest.Mock;
};

const makeSubscribeStub = (overrides: Partial<AnySubConn> = {}): AnySubConn => ({
  sfuNodeId: undefined,
  candidates: [],
  setRemoteDescription: jest.fn(() => Promise.resolve()),
  addIceCandidate: jest.fn(() => Promise.resolve()),
  createAnswer: jest.fn(() => Promise.resolve({ type: 'answer', sdp: 'answer-sdp' })),
  setLocalDescription: jest.fn(() => Promise.resolve()),
  ...overrides,
});

const offer = { type: 'offer', sdp: 'irrelevant' } as any;

describe('signalObserver.onOffer subscribe-renegotiation failure', () => {
  const cases: Array<{ label: string; subConn: () => AnySubConn; errMessage: string }> = [
    {
      label: 'setRemoteDescription rejects',
      errMessage: 'bad sdp',
      subConn: () => makeSubscribeStub({ setRemoteDescription: jest.fn(() => Promise.reject(new Error('bad sdp'))) }),
    },
    {
      label: 'addIceCandidate rejects',
      errMessage: 'bad candidate',
      subConn: () =>
        makeSubscribeStub({
          candidates: [{ candidate: 'c=foo' }],
          addIceCandidate: jest.fn(() => Promise.reject(new Error('bad candidate'))),
        }),
    },
    {
      label: 'createAnswer rejects',
      errMessage: 'createAnswer failed',
      subConn: () =>
        makeSubscribeStub({ createAnswer: jest.fn(() => Promise.reject(new Error('createAnswer failed'))) }),
    },
    {
      label: 'setLocalDescription rejects',
      errMessage: 'setLocal failed',
      subConn: () =>
        makeSubscribeStub({ setLocalDescription: jest.fn(() => Promise.reject(new Error('setLocal failed'))) }),
    },
  ];

  cases.forEach(({ label, subConn, errMessage }) => {
    it(`routes through onStateChange(Failed) and skips onFailure when ${label}`, async () => {
      const { transport, observer } = makeTransport();
      const t = transport as any;
      // Provide a stub signal so .answer() in the success path wouldn't blow
      // up — though we only exercise the catch here.
      t.signal = { answer: jest.fn() } as any;
      t.subscribeConnection = subConn();

      await t.signalObserver.onOffer(offer);

      expect(observer.onStateChange).toHaveBeenCalledTimes(1);
      const [state, ex] = (observer.onStateChange as jest.Mock).mock.calls[0];
      expect(state).toBe(TransportState.Failed);
      expect(ex).toBeDefined();
      expect((ex as Error).message ?? String(ex)).toContain(errMessage);

      // PR explicitly drops the redundant observer.onFailure — pin that so
      // a revert can't reintroduce it without breaking this assertion.
      expect(observer.onFailure).not.toHaveBeenCalled();
    });
  });

  it('does not call onStateChange on the success path', async () => {
    const { transport, observer } = makeTransport();
    const t = transport as any;
    t.signal = { answer: jest.fn() } as any;
    t.subscribeConnection = makeSubscribeStub();

    await t.signalObserver.onOffer(offer);

    expect(observer.onStateChange).not.toHaveBeenCalled();
    expect(observer.onFailure).not.toHaveBeenCalled();
    expect((t.signal as any).answer).toHaveBeenCalledTimes(1);
  });
});
