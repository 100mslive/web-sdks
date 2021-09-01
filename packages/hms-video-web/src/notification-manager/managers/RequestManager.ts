import { HMSRemotePeer, HMSRoleChangeRequest, HMSUpdateListener } from '../../interfaces';
import { IStore } from '../../sdk/store';
import { RoleChangeRequestParams, TrackUpdateRequestNotification } from '../HMSNotifications';

export class RequestManager {
  constructor(private store: IStore, private listener?: HMSUpdateListener) {}

  handleRoleChangeRequest(notification: RoleChangeRequestParams) {
    const request: HMSRoleChangeRequest = {
      requestedBy: this.store.getPeerById(notification.requested_by) as HMSRemotePeer,
      role: this.store.getPolicyForRole(notification.role),
      token: notification.token,
    };

    this.listener?.onRoleChangeRequest(request);
  }

  handleTrackUpdateRequest(trackUpdateRequest: TrackUpdateRequestNotification) {
    const { requested_by, track_id, mute } = trackUpdateRequest;
    const peer = this.store.getPeerById(requested_by);
    const track = this.store.getLocalPeerTracks().find((track) => track.initiallyPublishedTrackId === track_id);

    if (!peer || peer.isLocal || !track) {
      return;
    }

    const sendNotification = () => {
      this.listener?.onChangeTrackStateRequest({ requestedBy: peer as HMSRemotePeer, track, enabled: !mute });
    };

    if (mute) {
      /**
       * Directly mute track when request arrives
       */
      track.setEnabled(!mute).then(sendNotification);
    } else {
      /**
       * Notify UI to unmute for requesting consent
       */
      sendNotification();
    }
  }
}
