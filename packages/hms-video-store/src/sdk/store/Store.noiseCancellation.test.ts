import { Store } from './index';
import { HMSRole } from '../../interfaces';
import { Plugins, PolicyParams } from '../../notification-manager';
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

describe('Store noise cancellation policy writer', () => {
  let store: Store;
  let room: Room;

  beforeEach(() => {
    store = new Store();
    room = new Room('room-1');
    store.setRoom(room);
  });

  it('stays disabled when a reconnect re-writes the init flag after policy said no', () => {
    // Writer 1, first connect.
    room.isNoiseCancellationEnabledFromInit = true;
    // Writer 2, policy arrives and disables.
    store.setKnownRoles(policyWith({ [Plugins.NOISE_CANCELLATION]: { enabled: false } }));
    expect(room.isNoiseCancellationEnabled).toBe(false);

    // Writer 1 again — this is what retrySignalDisconnectTask -> internalConnect does
    // on every websocket reconnect. When the policy writer ANDed against its own prior
    // value instead of its own field, this reopened the Krisp gate for 158-483ms until
    // policy re-arrived, and a peer with a live audio track could attach inside it.
    room.isNoiseCancellationEnabledFromInit = true;
    expect(room.isNoiseCancellationEnabled).toBe(false);
  });

  it('revokes the policy source when a later policy drops the noiseCancellation key', () => {
    room.isNoiseCancellationEnabledFromInit = true;
    store.setKnownRoles(policyWith({ [Plugins.NOISE_CANCELLATION]: { enabled: true } }));
    expect(room.isNoiseCancellationEnabled).toBe(true);

    // Dispatching on the keys present in params.plugins meant a policy without the key
    // never ran the writer at all, so an earlier enable could not be revoked.
    store.setKnownRoles(policyWith({ whiteboard: {} }));
    expect(room.isNoiseCancellationEnabled).toBe(false);
  });
});
