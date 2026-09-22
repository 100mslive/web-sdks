/**
 * A publish connection that is still coming up must not be reported as disconnected.
 *
 * `onConnectionStateChange` treats every state that is not new/connected/failed as a loss and
 * arms `publishDisconnectTimer`. A fresh RTCPeerConnection passes through `connecting` on its
 * way up, so any peer whose publish ICE takes longer than ICE_DISCONNECTION_TIMEOUT (5s) raised
 * ICEDisconnected (4006) -> handleIceConnectionFailure -> RetryScheduler -> Reconnecting, for a
 * transport that had never connected in the first place. The app shows "reconnecting" moments
 * after it showed the peer as online.
 *
 * Prod signature: those 4006s carry `local candidate - undefined; remote candidate - undefined`.
 * `selectedCandidatePair` is only ever assigned in the `connected` branch and is never cleared,
 * so `undefined` can only mean the connection never reached `connected`. 3,024 such events over
 * 1,678 rooms and 53 accounts in 24h, steady at ~1,700-2,000 rooms/day across 14 days.
 *
 * The timer was also never cleared on success - only in `clearPeerConnections` - so every blip
 * stacked another one. The DTLS sibling handler already clears its timer on each state change.
 */

import HMSTransport from '.';
import { ErrorCodes } from '../error/ErrorCodes';
import { HMSException } from '../error/HMSException';
import { makeTransport } from '../test/helpers/makeTransport';
import { ICE_DISCONNECTION_TIMEOUT } from '../utils/constants';

type FakeTransport = {
  publishDisconnectTimer: number;
  publishEverConnected?: boolean;
  publishConnection: {
    connectionState: RTCPeerConnectionState;
    selectedCandidatePair?: { local?: { candidate: string }; remote?: { candidate: string } };
    handleSelectedIceCandidatePairs: jest.Mock;
  };
  connectivityListener: { onICESuccess: jest.Mock };
  handleIceConnectionFailure: jest.Mock;
  publishCandidateDescription: () => string;
};

const proto = HMSTransport.prototype as unknown as {
  handlePublishConnectionStateChange: (this: FakeTransport, s: RTCPeerConnectionState) => Promise<void>;
  publishCandidateDescription: (this: FakeTransport) => string;
};

/** A transport whose publish connection is in `state`, with no candidate pair unless given one. */
const makeFake = (state: RTCPeerConnectionState, hasCandidatePair = false): FakeTransport => {
  const fake: FakeTransport = {
    publishDisconnectTimer: 0,
    // a fresh transport has not been up yet; the real field default is asserted separately
    publishEverConnected: false,
    publishConnection: {
      connectionState: state,
      selectedCandidatePair: hasCandidatePair
        ? { local: { candidate: 'candidate:local' }, remote: { candidate: 'candidate:remote' } }
        : undefined,
      handleSelectedIceCandidatePairs: jest.fn(),
    },
    connectivityListener: { onICESuccess: jest.fn() },
    handleIceConnectionFailure: jest.fn(),
    publishCandidateDescription: () => proto.publishCandidateDescription.call(fake),
  };
  return fake;
};

const drive = (fake: FakeTransport, state: RTCPeerConnectionState) =>
  proto.handlePublishConnectionStateChange.call(fake, state);

describe('publish connection still connecting is not a disconnect', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('does not report a disconnect for a connection that never came up', async () => {
    // fresh peer connection: new -> connecting, and publish ICE is slower than 5s
    const fake = makeFake('connecting');

    await drive(fake, 'connecting');
    jest.advanceTimersByTime(ICE_DISCONNECTION_TIMEOUT + 1000);

    expect(fake.handleIceConnectionFailure).not.toHaveBeenCalled();
  });

  /** drives a real HMSTransport so the field's own default is what is under test, not a fake's */
  it('starts out never-connected, so a real fresh transport does not arm the timer', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = makeTransport().transport as any;
    t.publishConnection = { connectionState: 'connecting', handleSelectedIceCandidatePairs: jest.fn() };
    t.handleIceConnectionFailure = jest.fn();

    await t.handlePublishConnectionStateChange('connecting');
    jest.advanceTimersByTime(ICE_DISCONNECTION_TIMEOUT + 1000);

    expect(t.handleIceConnectionFailure).not.toHaveBeenCalled();
  });

  it('still reports a genuine disconnect on a connection that had come up', async () => {
    const fake = makeFake('connected', true);
    await drive(fake, 'connected');

    // the transport drops after having been established
    fake.publishConnection.connectionState = 'disconnected';
    await drive(fake, 'disconnected');
    jest.advanceTimersByTime(ICE_DISCONNECTION_TIMEOUT + 1000);

    expect(fake.handleIceConnectionFailure).toHaveBeenCalledTimes(1);
    const error = fake.handleIceConnectionFailure.mock.calls[0][1] as HMSException;
    expect(error.code).toBe(ErrorCodes.WebrtcErrors.ICE_DISCONNECTED);
    // a real disconnect knows its candidate pair; that is what distinguishes it in prod
    expect(error.description).toContain('candidate:local');
  });

  it('clears the armed timer once the connection comes up, instead of leaving it to stack', async () => {
    const fake = makeFake('connected', true);
    await drive(fake, 'connected');
    fake.publishConnection.connectionState = 'disconnected';
    await drive(fake, 'disconnected');
    expect(fake.publishDisconnectTimer).not.toBe(0);

    fake.publishConnection.connectionState = 'connected';
    await drive(fake, 'connected');

    expect(fake.publishDisconnectTimer).toBe(0);
    jest.advanceTimersByTime(ICE_DISCONNECTION_TIMEOUT + 1000);
    expect(fake.handleIceConnectionFailure).not.toHaveBeenCalled();
  });

  it('still reports ICE failure immediately when the connection reaches failed', async () => {
    const fake = makeFake('failed');

    await drive(fake, 'failed');

    expect(fake.handleIceConnectionFailure).toHaveBeenCalledTimes(1);
    const error = fake.handleIceConnectionFailure.mock.calls[0][1] as HMSException;
    expect(error.code).toBe(ErrorCodes.WebrtcErrors.ICE_FAILURE);
  });

  it('reports ICE success and records the candidate pair on connect', async () => {
    const fake = makeFake('connected', true);

    await drive(fake, 'connected');

    expect(fake.connectivityListener.onICESuccess).toHaveBeenCalledWith(true);
    expect(fake.publishConnection.handleSelectedIceCandidatePairs).toHaveBeenCalledTimes(1);
  });
});
