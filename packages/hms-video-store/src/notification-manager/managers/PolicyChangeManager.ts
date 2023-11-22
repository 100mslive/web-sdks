import { EventBus } from '../../events/EventBus';
import { Store } from '../../sdk/store';
import HMSLogger from '../../utils/logger';
import { PolicyParams } from '../HMSNotifications';

/**
 * Handles:
 * - Set policy with publishParams, simulcast layers to store
 * - Emit 'local-peer-role-update' to trigger RoleChangeManager to publish/unpublish local tracks
 * - Emit 'policy-change' to finish preview before calling listener.onPreview
 */
export class PolicyChangeManager {
  constructor(private store: Store, private eventBus: EventBus) {}

  handlePolicyChange(params: PolicyParams) {
    const localPeer = this.store.getLocalPeer();

    if (localPeer && !localPeer.role) {
      const newRole = params.known_roles[params.name];
      localPeer.updateRole(newRole);
    }

    this.store.setKnownRoles(params);
    const room = this.store.getRoom();
    if (room) {
      room.templateId = params.template_id;
    } else {
      HMSLogger.w('[PolicyChangeManager]', 'on policy change - room not present');
    }
    // handle when role is not present in known_roles
    // const publishParams = params.known_roles[params.name]?.publishParams;
    // this.store.setPublishParams(publishParams);

    this.updateLocalPeerRole(params);
    this.eventBus.policyChange.publish(params);
  }

  private updateLocalPeerRole(params: PolicyParams) {
    const localPeer = this.store.getLocalPeer();
    if (localPeer?.role && localPeer.role.name !== params.name) {
      const newRole = this.store.getPolicyForRole(params.name);
      const oldRole = localPeer.role;
      localPeer.updateRole(newRole);
      if (newRole.name === localPeer.asRole?.name) {
        delete localPeer.asRole;
      }
      this.eventBus.localRoleUpdate.publish({ oldRole, newRole });
    }
  }
}
