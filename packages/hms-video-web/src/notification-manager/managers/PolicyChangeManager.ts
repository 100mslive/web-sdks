import EventEmitter from 'events';
import { IStore } from '../../sdk/store';
import { PolicyParams } from '../HMSNotifications';

/**
 * Handles:
 * - Set policy with publishParams, simulcast layers to store
 * - Emit 'local-peer-role-update' to trigger RoleChangeManager to publish/unpublish local tracks
 * - Emit 'policy-change' to finish preview before calling listener.onPreview
 */
export class PolicyChangeManager {
  constructor(private store: IStore, private eventEmitter: EventEmitter) {}

  handlePolicyChange(params: PolicyParams) {
    const localPeer = this.store.getLocalPeer();

    if (localPeer && !localPeer.role) {
      const newRole = params.known_roles[params.name];
      localPeer.updateRole(newRole);
    }

    this.store.setKnownRoles(params.known_roles);
    // handle when role is not present in known_roles
    const publishParams = params.known_roles[params.name]?.publishParams;
    this.store.setPublishParams(publishParams);
    if (publishParams && Object.keys(publishParams).length > 0) {
      const { videoSimulcastLayers, screenSimulcastLayers } = publishParams;
      this.store.setVideoSimulcastLayers(videoSimulcastLayers);
      this.store.setScreenshareSimulcastLayers(screenSimulcastLayers);
    }

    if (localPeer?.role && localPeer.role.name !== params.name) {
      const newRole = this.store.getPolicyForRole(params.name);
      const oldRole = localPeer.role;
      localPeer.updateRole(newRole);
      this.eventEmitter.emit('local-peer-role-update', { detail: { oldRole, newRole } });
    }
    this.eventEmitter.emit('policy-change', { detail: { params } });
  }
}
