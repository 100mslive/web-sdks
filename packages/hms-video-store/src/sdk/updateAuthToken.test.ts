import { HMSSdk } from './index';
import { HMSException } from '../error/HMSException';
import { HMSConfig, HMSUpdateListener } from '../interfaces';
import { JoinParameters } from '../transport/models/JoinParameters';

const makeToken = (payload: Record<string, string>) => `header.${btoa(JSON.stringify(payload))}.signature`;

const original = makeToken({ room_id: 'room-1', user_id: 'user-1', role: 'host' });
const refreshed = makeToken({ room_id: 'room-1', user_id: 'user-1', role: 'host', jti: 'new' });

/**
 * Sessions longer than the token lifetime die on the first reconnect after expiry, because
 * every reconnect re-sends the join-time token to init and the websocket (init 401 is terminal).
 * updateAuthToken swaps the token that reconnects read.
 */
describe('HMSSdk.updateAuthToken', () => {
  const setup = () => {
    const sdk = new HMSSdk();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = sdk as any;
    s.initStoreAndManagers({} as HMSUpdateListener);
    s.store.config = { authToken: original, userName: 'test' } as HMSConfig;
    s.transport.joinParameters = new JoinParameters(original, 'peer-1', 'test', '', 'https://init.example');
    return { sdk, s };
  };

  it('uses the new token on the next signal reconnect', async () => {
    const { sdk, s } = setup();
    const internalConnect = jest.fn(() => Promise.resolve({}));
    s.transport.internalConnect = internalConnect;
    s.transport.signal = { isConnected: false, trackUpdate: jest.fn() };

    sdk.updateAuthToken(refreshed);
    await s.transport.retrySignalDisconnectTask();

    expect(internalConnect).toHaveBeenCalledWith(refreshed, 'https://init.example', 'peer-1', undefined);
    expect(s.store.getConfig().authToken).toBe(refreshed);
  });

  it.each([
    ['room', makeToken({ room_id: 'room-2', user_id: 'user-1', role: 'host' })],
    ['user', makeToken({ room_id: 'room-1', user_id: 'user-2', role: 'host' })],
  ])('rejects a token for a different %s and keeps the old one', (_, token) => {
    const { sdk, s } = setup();

    expect(() => sdk.updateAuthToken(token)).toThrow(HMSException);
    expect(s.transport.joinParameters.authToken).toBe(original);
    expect(s.store.getConfig().authToken).toBe(original);
  });

  it('rejects before preview or join', () => {
    const sdk = new HMSSdk();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sdk as any).initStoreAndManagers({} as HMSUpdateListener);

    expect(() => sdk.updateAuthToken(refreshed)).toThrow(HMSException);
  });
});
