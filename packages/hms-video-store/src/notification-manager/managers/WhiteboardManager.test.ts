import { WhiteboardManager } from './WhiteboardManager';
import { HMSUpdateListener } from '../../interfaces';
import { HMSPeerType } from '../../interfaces/peer/hms-peer';
import { HMSLocalPeer } from '../../sdk/models/peer';
import { Store } from '../../sdk/store';
import HMSTransport from '../../transport';
import { HMSNotificationMethod } from '../HMSNotificationMethod';

const WHITEBOARD_ID = '68c1e2a04944f067313a7338-whiteboard';
const OWNER_USER_ID = 'shared-customer-user-id';
const OTHER_USER_ID = 'some-other-customer-user-id';

const flushMicrotasks = () => new Promise(resolve => setTimeout(resolve, 0));

const buildGetWhiteboard = () =>
  jest.fn().mockResolvedValue({
    id: WHITEBOARD_ID,
    token: 'fetched-whiteboard-token',
    addr: 'store-prod-in3-grpc.100ms.live',
    owner: OWNER_USER_ID,
    permissions: ['read', 'write'],
  });

const buildManager = (localCustomerUserId: string, getWhiteboard: jest.Mock) => {
  const store = new Store();
  store.addPeer(
    new HMSLocalPeer({ name: 'second-tab', customerUserId: localCustomerUserId, type: HMSPeerType.REGULAR }),
  );
  const listener = { onWhiteboardUpdate: jest.fn() } as unknown as HMSUpdateListener;
  const transport = { signal: { getWhiteboard } } as unknown as HMSTransport;
  return { store, listener, manager: new WhiteboardManager(store, transport, listener) };
};

describe('WhiteboardManager', () => {
  it('fetches a token when the local peer shares the owner customerUserId but never opened it', async () => {
    const getWhiteboard = buildGetWhiteboard();
    const { store, manager } = buildManager(OWNER_USER_ID, getWhiteboard);

    manager.handleNotification(HMSNotificationMethod.WHITEBOARD_UPDATE, {
      id: WHITEBOARD_ID,
      owner: OWNER_USER_ID,
      state: 'open',
    });
    await flushMicrotasks();

    expect(getWhiteboard).toHaveBeenCalledWith({ id: WHITEBOARD_ID });
    expect(store.getWhiteboard(WHITEBOARD_ID)).toMatchObject({
      open: true,
      token: 'fetched-whiteboard-token',
      addr: 'store-prod-in3-grpc.100ms.live',
    });
  });

  it('reuses the existing token for the client that opened the whiteboard', async () => {
    const getWhiteboard = buildGetWhiteboard();
    const { store, manager } = buildManager(OWNER_USER_ID, getWhiteboard);
    store.setWhiteboard({
      id: WHITEBOARD_ID,
      open: true,
      owner: OWNER_USER_ID,
      token: 'locally-created-token',
      addr: 'store-prod-in3-grpc.100ms.live',
      permissions: ['read', 'write', 'admin'],
      isLocalOwner: true,
    });

    manager.handleNotification(HMSNotificationMethod.WHITEBOARD_UPDATE, {
      id: WHITEBOARD_ID,
      owner: OWNER_USER_ID,
      state: 'open',
    });
    await flushMicrotasks();

    expect(getWhiteboard).not.toHaveBeenCalled();
    expect(store.getWhiteboard(WHITEBOARD_ID)).toMatchObject({ open: true, token: 'locally-created-token' });
  });

  // The opener drops its token on close, so keying the opener shortcut off a stored token
  // would let a stale open echo reopen the board.
  it('keeps the whiteboard closed for the client that closed it locally', async () => {
    const getWhiteboard = buildGetWhiteboard();
    const { store, manager } = buildManager(OWNER_USER_ID, getWhiteboard);
    store.setWhiteboard({ id: WHITEBOARD_ID, open: false, isLocalOwner: true });

    manager.handleNotification(HMSNotificationMethod.WHITEBOARD_UPDATE, {
      id: WHITEBOARD_ID,
      owner: OWNER_USER_ID,
      state: 'open',
    });
    await flushMicrotasks();

    expect(getWhiteboard).not.toHaveBeenCalled();
    expect(store.getWhiteboard(WHITEBOARD_ID)).toMatchObject({ open: false });
  });

  it('closes for a duplicate tab that shares the owner customerUserId', async () => {
    const getWhiteboard = buildGetWhiteboard();
    const { store, manager } = buildManager(OWNER_USER_ID, getWhiteboard);
    // The duplicate tab fetched its own access on the open update - it is a viewer, not the opener.
    store.setWhiteboard({
      id: WHITEBOARD_ID,
      open: true,
      owner: OWNER_USER_ID,
      token: 'fetched-whiteboard-token',
      addr: 'store-prod-in3-grpc.100ms.live',
      permissions: ['read', 'write'],
    });

    manager.handleNotification(HMSNotificationMethod.WHITEBOARD_UPDATE, {
      id: WHITEBOARD_ID,
      owner: OWNER_USER_ID,
      state: 'closed',
    });
    await flushMicrotasks();

    expect(store.getWhiteboard(WHITEBOARD_ID)).toMatchObject({ open: false });
  });

  // buildWhiteboard rebuilds the record per notification, so the opener would decay into a
  // viewer on the first remote update if the flag were not carried forward.
  it('keeps the opener flag across remote updates', async () => {
    const getWhiteboard = buildGetWhiteboard();
    const { store, manager } = buildManager(OWNER_USER_ID, getWhiteboard);
    store.setWhiteboard({
      id: WHITEBOARD_ID,
      open: true,
      owner: OWNER_USER_ID,
      token: 'locally-created-token',
      isLocalOwner: true,
    });

    for (let i = 0; i < 2; i++) {
      manager.handleNotification(HMSNotificationMethod.WHITEBOARD_UPDATE, {
        id: WHITEBOARD_ID,
        owner: OWNER_USER_ID,
        state: 'open',
      });
      await flushMicrotasks();
    }

    expect(getWhiteboard).not.toHaveBeenCalled();
    expect(store.getWhiteboard(WHITEBOARD_ID)).toMatchObject({ token: 'locally-created-token' });
  });

  it('fetches a token for a peer that is not the owner', async () => {
    const getWhiteboard = buildGetWhiteboard();
    const { store, manager } = buildManager(OTHER_USER_ID, getWhiteboard);

    manager.handleNotification(HMSNotificationMethod.WHITEBOARD_UPDATE, {
      id: WHITEBOARD_ID,
      owner: OWNER_USER_ID,
      state: 'open',
    });
    await flushMicrotasks();

    expect(getWhiteboard).toHaveBeenCalledWith({ id: WHITEBOARD_ID });
    expect(store.getWhiteboard(WHITEBOARD_ID)).toMatchObject({ open: true, token: 'fetched-whiteboard-token' });
  });
});
