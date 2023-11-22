import { HMSRemotePeer, HMSRoleChangeRequest, HMSUpdateListener } from '../../interfaces';
import { HMSLocalTrack, HMSTrackSource } from '../../media/tracks';
import { Store } from '../../sdk/store';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import {
  ChangeTrackMuteStateNotification,
  RoleChangeRequestParams,
  TrackUpdateRequestNotification,
} from '../HMSNotifications';

/**
 * Handles request from remote peers to change something on the local side. For eg. role change, track mute/unmute.
 */
export class RequestManager {
  constructor(private store: Store, public listener?: HMSUpdateListener) {}

  handleNotification(method: string, notification: any) {
    switch (method) {
      case HMSNotificationMethod.ROLE_CHANGE_REQUEST:
        this.handleRoleChangeRequest(notification as RoleChangeRequestParams);
        break;

      case HMSNotificationMethod.TRACK_UPDATE_REQUEST:
        this.handleTrackUpdateRequest(notification as TrackUpdateRequestNotification);
        break;

      case HMSNotificationMethod.CHANGE_TRACK_MUTE_STATE_UPDATE:
        this.handleChangeTrackStateRequest(notification as ChangeTrackMuteStateNotification);
        break;
      default:
        return;
    }
  }

  private handleRoleChangeRequest(notification: RoleChangeRequestParams) {
    const request: HMSRoleChangeRequest = {
      requestedBy: notification.requested_by
        ? (this.store.getPeerById(notification.requested_by) as HMSRemotePeer)
        : undefined,
      role: this.store.getPolicyForRole(notification.role),
      token: notification.token,
    };

    this.listener?.onRoleChangeRequest(request);
  }

  // eslint-disable-next-line complexity
  private handleTrackUpdateRequest(trackUpdateRequest: TrackUpdateRequestNotification) {
    const { requested_by, track_id, mute } = trackUpdateRequest;
    const peer = requested_by ? this.store.getPeerById(requested_by) : undefined;
    const track = this.store.getLocalPeerTracks().find(track => track.publishedTrackId === track_id);

    if (!track) {
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

  private handleChangeTrackStateRequest(request: ChangeTrackMuteStateNotification) {
    const { type, source, value, requested_by } = request;
    const peer = requested_by ? this.store.getPeerById(requested_by) : undefined;

    // value true means the track has to be muted
    const enabled = !value;
    const tracksToBeUpdated = this.getTracksToBeUpdated({ type, source, enabled });
    //Do nothing if all tracks are already in same state as the request
    if (tracksToBeUpdated.length === 0) {
      return;
    }
    // if track is to be muted, mute and send the notification, otherwise send notification
    if (!enabled) {
      const promises: Promise<void>[] = [];

      for (const track of tracksToBeUpdated) {
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

  /**
   * Filter the local tracks based on type, source and enabled state
   * @returns {HMSLocalTrack[]}
   */
  private getTracksToBeUpdated({
    type,
    source,
    enabled,
  }: {
    type?: 'audio' | 'video';
    source?: HMSTrackSource;
    enabled: boolean;
  }) {
    const localPeerTracks = this.store.getLocalPeerTracks();
    let tracks: HMSLocalTrack[] = localPeerTracks;
    if (type) {
      tracks = tracks.filter(track => track.type === type);
    }
    if (source) {
      tracks = tracks.filter(track => track.source === source);
    }
    // filter out tracks which are already in the desired state
    return tracks.filter(track => track.enabled !== enabled);
  }
}
