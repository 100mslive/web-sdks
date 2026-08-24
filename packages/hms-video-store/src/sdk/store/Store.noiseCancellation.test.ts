/**
 * `room.isNoiseCancellationEnabled` had two writers: `HMSTransport.internalConnect`
 * wrote the raw `/init` feature flag, and `Store.handleNoiseCancellationPlugin`
 * ANDed the template policy against that same field. `retrySignalDisconnectTask`
 * re-runs `internalConnect` on every websocket reconnect, so each reconnect reset
 * the field to the raw init flag and reopened the Krisp gate until policy re-arrived.
 *
 * These tests drive the init source through the real seam — `InitService.fetchInitConfig`
 * -> `isFlagEnabled(InitFlags.FLAG_NOISE_CANCELLATION)` -> `internalConnect` — and read
 * only the public `isNoiseCancellationEnabled`. They deliberately never name the two
 * source fields, so the file compiles against the pre-fix sources and fails there.
 */

import { Store } from './index';
import { HMSRole } from '../../interfaces';
import { Plugins, PolicyParams } from '../../notification-manager';
import InitService from '../../signal/init';
import { InitConfig, InitFlags } from '../../signal/init/models';
import { makeTransport, TransportState } from '../../test/helpers/makeTransport';
import Room from '../models/HMSRoom';

const hostRole = {
  name: 'host',
  priority: 1,
  subscribeParams: { maxSubsBitRate: 1000, subscribeToRoles: ['host'] },
  publishParams: { allowed: ['audio', 'video'] },
} as unknown as HMSRole;

const policyWith = (plugins: PolicyParams['plugins']): PolicyParams => ({
  name: 'host',
  template_id: 'template-1',
  known_roles: { host: hostRole },
  plugins,
});

const initConfigWith = (flags: InitFlags[]) =>
  ({
    endpoint: 'wss://test.100ms.live',
    log_level: 'info',
    policy: '',
    rtcConfiguration: {},
    config: {
      enabledFlags: flags,
      networkHealth: { url: '', timeout: 0, scoreMap: {} },
    },
  } as unknown as InitConfig);

describe('noise cancellation gate across init and policy', () => {
  let store: Store;
  let room: Room;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let transport: any;
  let fetchInitConfig: jest.SpyInstance;

  /** One websocket connect. This is what `retrySignalDisconnectTask` re-runs on every reconnect. */
  const connect = () => transport.internalConnect('auth-token', 'https://init.100ms.live', 'peer-1');

  beforeEach(() => {
    const made = makeTransport();
    transport = made.transport;
    store = made.store;
    room = new Room('room-1');
    store.setRoom(room);

    // Everything after the init-flag write in `internalConnect` needs a socket; stub it out.
    transport.state = TransportState.Joined; // else validateNotDisconnected('post init') throws
    transport.openSignal = jest.fn(async () => {});
    transport.analyticsEventsService = { setTransport: jest.fn(), flush: jest.fn() };

    fetchInitConfig = jest.spyOn(InitService, 'fetchInitConfig');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stays disabled when a reconnect re-writes the init flag after policy said no', async () => {
    fetchInitConfig.mockResolvedValue(initConfigWith([InitFlags.FLAG_NOISE_CANCELLATION]));

    await connect();
    store.setKnownRoles(policyWith({ [Plugins.NOISE_CANCELLATION]: { enabled: false } }));
    expect(room.isNoiseCancellationEnabled).toBe(false);

    // The reconnect. Pre-fix this assignment landed on the same field the policy
    // writer owned, reopening the Krisp gate for 158-483ms until policy re-arrived —
    // long enough for a peer with a live audio track to attach inside it.
    await connect();
    expect(room.isNoiseCancellationEnabled).toBe(false);
  });

  it('stays disabled when the account flag is off even if the template enables it', async () => {
    fetchInitConfig.mockResolvedValue(initConfigWith([]));

    await connect();
    store.setKnownRoles(policyWith({ [Plugins.NOISE_CANCELLATION]: { enabled: true } }));
    expect(room.isNoiseCancellationEnabled).toBe(false);
  });

  it('is enabled only when both the account flag and the template policy allow it', async () => {
    fetchInitConfig.mockResolvedValue(initConfigWith([InitFlags.FLAG_NOISE_CANCELLATION]));

    await connect();
    store.setKnownRoles(policyWith({ [Plugins.NOISE_CANCELLATION]: { enabled: true } }));
    expect(room.isNoiseCancellationEnabled).toBe(true);
  });

  it('revokes the policy source when a later policy drops the noiseCancellation key', async () => {
    fetchInitConfig.mockResolvedValue(initConfigWith([InitFlags.FLAG_NOISE_CANCELLATION]));

    await connect();
    store.setKnownRoles(policyWith({ [Plugins.NOISE_CANCELLATION]: { enabled: true } }));
    expect(room.isNoiseCancellationEnabled).toBe(true);

    // Defensive: the server always emits the key today, so this is an invariant
    // against a future serializer change rather than an observed leak. Dispatching
    // on the keys present in params.plugins would skip the writer entirely here.
    store.setKnownRoles(policyWith({ whiteboard: {} }));
    expect(room.isNoiseCancellationEnabled).toBe(false);
  });
});
