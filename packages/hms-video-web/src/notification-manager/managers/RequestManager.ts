import { HMSLocalTrack } from '../../media/tracks';
import { HMSRemotePeer, HMSRoleChangeRequest, HMSUpdateListener } from '../../interfaces';
import { IStore } from '../../sdk/store';
import {
  RoleChangeRequestParams,
  TrackUpdateRequestNotification,
  ChangeTrackMuteStateNotification,
} from '../HMSNotifications';

/**
 * Handles request from remote peers to change something on the local side. For eg. role change, track mute/unmute.
 */
export class RequestManager {
  constructor(private store: IStore, public listener?: HMSUpdateListener) {}

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
    const track = this.store.getLocalPeerTracks().find(track => track.publishedTrackId === track_id);

    if (!peer || peer.isLocal || !track) {
      return;
    }

    const sendNotification = () => {
      this.listener?.onChangeTrackStateRequest({ requestedBy: peer as HMSRemotePeer, track, enabled: !mute });
    };

    if (mute) {
      // if track is already in the same state as change state, do nothing
      if (track.enabled === !mute) {
        return;
      }
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

  handleChangeTrackStateRequest(request: ChangeTrackMuteStateNotification) {
    const { type, source, value, requested_by } = request;
    const peer = this.store.getPeerById(requested_by);

    if (!peer) {
      return;
    }
    // value true means the track has to be muted
    const enabled = !value;
    const localPeerTracks = this.store.getLocalPeerTracks();
    let tracks: HMSLocalTrack[] = localPeerTracks;
    if (type) {
      tracks = tracks.filter(track => track.type === type);
    }

    if (source) {
      tracks = tracks.filter(track => track.source === source);
    }

    const tracksToBeUpdated = tracks.filter(track => track.enabled !== enabled);
    //Do nothing if all tracks are already in same state as the request
    if (tracksToBeUpdated.length === 0) {
      return;
    }
    // if track is to be muted, mute and send the notification, otherwise send notification
    if (!enabled) {
      const promises: Promise<void>[] = [];

      for (let track of tracksToBeUpdated) {
        promises.push(track.setEnabled(false));
      }
      Promise.all(promises).then(() => {
        this.listener?.onChangeMultiTrackStateRequest({
          requestedBy: peer as HMSRemotePeer,
          tracks: tracksToBeUpdated,
          enabled: false,
        });
      });
    } else {
      this.listener?.onChangeMultiTrackStateRequest({
        requestedBy: peer as HMSRemotePeer,
        tracks: tracksToBeUpdated,
        type,
        source,
        enabled: true,
      });
    }
  }
}
