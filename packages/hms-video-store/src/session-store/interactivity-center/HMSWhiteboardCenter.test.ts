import { WhiteboardInteractivityCenter } from './HMSWhiteboardCenter';
import { InteractivityListener } from '../../interfaces';
import { Store } from '../../sdk/store';
import HMSTransport from '../../transport';

const WHITEBOARD_ID = '68c1e2a04944f067313a7338-whiteboard';
const OWNER_USER_ID = 'shared-customer-user-id';

const buildCenter = () => {
  const store = new Store();
  const transport = {
    isFlagEnabled: () => true,
    signal: {
      createWhiteboard: jest.fn().mockResolvedValue({ id: WHITEBOARD_ID }),
      getWhiteboard: jest.fn().mockResolvedValue({
        id: WHITEBOARD_ID,
        token: 'locally-created-token',
        addr: 'store-prod-in3-grpc.100ms.live',
        owner: OWNER_USER_ID,
        permissions: ['read', 'write', 'admin'],
      }),
    },
  } as unknown as HMSTransport;
  const listener = { onWhiteboardUpdate: jest.fn() } as unknown as InteractivityListener;
  return { store, center: new WhiteboardInteractivityCenter(transport, store, listener) };
};

describe('WhiteboardInteractivityCenter', () => {
  it('marks the whiteboard as opened by this client', async () => {
    const { store, center } = buildCenter();

    await center.open();

    expect(store.getWhiteboard(WHITEBOARD_ID)).toMatchObject({ open: true, isLocalOwner: true });
  });

  // close() drops the token, so the flag is the only thing left that identifies this client as
  // the opener - losing it would let a stale open notification reopen the board.
  it('keeps the opener flag after closing', async () => {
    const { store, center } = buildCenter();

    await center.open();
    await center.close(WHITEBOARD_ID);

    expect(store.getWhiteboard(WHITEBOARD_ID)).toMatchObject({ open: false, isLocalOwner: true });
  });
});
