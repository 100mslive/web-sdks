import { IStore } from '../../sdk/store';
import { PolicyParams } from '../HMSNotifications';
import { PublishParams } from '../../interfaces';
import { EventBus } from '../../events/EventBus';

/**
 * Handles:
 * - Set policy with publishParams, simulcast layers to store
 * - Emit 'local-peer-role-update' to trigger RoleChangeManager to publish/unpublish local tracks
 * - Emit 'policy-change' to finish preview before calling listener.onPreview
 */
export class PolicyChangeManager {
  constructor(private store: IStore, private eventBus: EventBus) {}

  handlePolicyChange(params: PolicyParams) {
    const localPeer = this.store.getLocalPeer();

    if (localPeer && !localPeer.role) {
      const newRole = params.known_roles[params.name];
      localPeer.updateRole(newRole);
    }

    this.store.setKnownRoles(params.known_roles);
    this.store.getRoom().templateId = params.template_id;
    // handle when role is not present in known_roles
    const publishParams = params.known_roles[params.name]?.publishParams;
    this.store.setPublishParams(publishParams);
    this.setSimulcastLayers(publishParams);

    this.handleStreamingRecordingPermissions(params.known_roles[params.name]?.permissions);

    if (localPeer?.role && localPeer.role.name !== params.name) {
      const newRole = this.store.getPolicyForRole(params.name);
      const oldRole = localPeer.role;
      localPeer.updateRole(newRole);
      this.eventBus.localRoleUpdate.publish({ oldRole, newRole });
    }
    this.eventBus.policyChange.publish(params);
  }

  setSimulcastLayers(publishParams?: PublishParams) {
    if (publishParams && Object.keys(publishParams).length > 0) {
      const { videoSimulcastLayers, screenSimulcastLayers } = publishParams;
      this.store.setVideoSimulcastLayers(videoSimulcastLayers);
      this.store.setScreenshareSimulcastLayers(screenSimulcastLayers);
    }
  }

  // TODO: remove this fn with hard coded value of rtmp and recording permissions when they're sent from the server.
  handleStreamingRecordingPermissions(permissions?: { recording?: boolean; streaming?: boolean }) {
    if (permissions) {
      if (permissions.recording === undefined) {
        permissions.recording = true;
      }
      if (permissions.streaming === undefined) {
        permissions.streaming = true;
      }
    }
  }
}
