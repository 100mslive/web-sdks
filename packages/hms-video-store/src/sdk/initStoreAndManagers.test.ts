import { HMSSdk } from './index';
import { HMSUpdateListener } from '../interfaces';

const makeListener = () =>
  ({
    onJoin: jest.fn(),
    onPreview: jest.fn(),
    onRoomUpdate: jest.fn(),
    onPeerUpdate: jest.fn(),
    onTrackUpdate: jest.fn(),
    onMessageReceived: jest.fn(),
    onError: jest.fn(),
    onReconnected: jest.fn(),
    onReconnecting: jest.fn(),
    onRoleChangeRequest: jest.fn(),
    onRoleUpdate: jest.fn(),
    onDeviceChange: jest.fn(),
    onChangeTrackStateRequest: jest.fn(),
    onChangeMultiTrackStateRequest: jest.fn(),
    onRemovedFromRoom: jest.fn(),
    onNetworkQuality: jest.fn(),
    onSessionStoreUpdate: jest.fn(),
    onPollsUpdate: jest.fn(),
    onWhiteboardUpdate: jest.fn(),
    onSFUMigration: jest.fn(),
  } as unknown as HMSUpdateListener);

/**
 * transport is the only manager that doesn't take the listener in its constructor. When it was
 * only set in the already-initialised branch, a join with no preview left it unset and every
 * transport-emitted update (onSFUMigration) was dropped - the reactive store then kept the
 * pre-migration local track ids for the rest of the session.
 */
describe('HMSSdk.initStoreAndManagers', () => {
  it('sets the transport listener on first init (join without preview)', () => {
    const sdk = new HMSSdk();
    const listener = makeListener();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sdk as any).initStoreAndManagers(listener);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((sdk as any).transport.listener).toBe(listener);
  });

  it('updates the transport listener on a second init (preview then join)', () => {
    const sdk = new HMSSdk();
    const previewListener = makeListener();
    const joinListener = makeListener();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sdk as any).initStoreAndManagers(previewListener);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sdk as any).initStoreAndManagers(joinListener);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((sdk as any).transport.listener).toBe(joinListener);
  });
});
