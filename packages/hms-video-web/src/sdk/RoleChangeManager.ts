import { HMSRole } from '../interfaces';
import InitialSettings from '../interfaces/settings';
import { HMSPeerUpdate, HMSTrackUpdate, HMSUpdateListener } from '../interfaces/update-listener';
import ITransport from '../transport/ITransport';
import { IStore } from './store';

export type PublishConfig = {
  publishAudio?: boolean;
  publishVideo?: boolean;
};

export default class RoleChangeManager {
  constructor(
    private store: IStore,
    private transport: ITransport,
    private publish: (settings: InitialSettings, publishConfig?: PublishConfig) => void,
    private removeAuxillaryTrack: (trackId: string) => void,
    private listener?: HMSUpdateListener,
  ) {}

  public handleLocalPeerRoleUpdate = async (event: any) => {
    const localPeer = this.store.getLocalPeer();

    if (!localPeer) {
      return;
    }
    const oldRole = event.detail.oldRole as HMSRole;
    const newRole = event.detail.newRole as HMSRole;

    const wasPublishing = oldRole.publishParams.allowed || [];
    const isPublishing = newRole.publishParams.allowed || [];

    const toRemove = {
      removeVideo: false,
      removeAudio: false,
      removeScreen: false,
    };

    if (wasPublishing.length > 0) {
      // check if we have to remove any tracks
      if (isPublishing.length === 0) {
        toRemove.removeVideo = true;
        toRemove.removeAudio = true;
        toRemove.removeScreen = true;
      } else {
        if (wasPublishing.includes('video') && !isPublishing.includes('video')) {
          toRemove.removeVideo = true;
        }

        if (wasPublishing.includes('audio') && !isPublishing.includes('audio')) {
          toRemove.removeAudio = true;
        }

        if (wasPublishing.includes('screen') && !isPublishing.includes('screen')) {
          toRemove.removeScreen = true;
        }
      }
    }

    await this.removeLocalTracks(toRemove);
    this.store.setPublishParams(newRole.publishParams);

    const newTracksToCreate = isPublishing
      .filter((val) => !wasPublishing.includes(val))
      .filter((val) => val !== 'screen');
    const publishConfig: PublishConfig = {
      publishAudio: newTracksToCreate.includes('audio'),
      publishVideo: newTracksToCreate.includes('video'),
    };

    if (newTracksToCreate.length > 0) {
      const initialSettings = this.store.getConfig()?.settings || {
        isAudioMuted: true,
        isVideoMuted: true,
        audioInputDeviceId: 'default',
        videoDeviceId: 'default',
        audioOutputDeviceId: 'default',
      };
      await this.publish({ ...initialSettings, isAudioMuted: true, isVideoMuted: true }, publishConfig);
    }

    this.listener?.onPeerUpdate(HMSPeerUpdate.ROLE_UPDATED, localPeer);
  };

  private async removeLocalTracks({
    removeVideo,
    removeAudio,
    removeScreen,
  }: {
    removeVideo: boolean;
    removeAudio: boolean;
    removeScreen: boolean;
  }) {
    const localPeer = this.store.getLocalPeer();

    if (!localPeer) {
      return;
    }

    const tracksToUnpublish = [];

    // TODO check auxillary tracks for regular audio and video too
    if (localPeer?.videoTrack && removeVideo) {
      // TODO: stop processed track and cleanup plugins loop non async
      // vb can throw change role off otherwise
      tracksToUnpublish.push(localPeer.videoTrack);
      localPeer.videoTrack = undefined;
    }

    if (localPeer?.audioTrack && removeAudio) {
      tracksToUnpublish.push(localPeer.audioTrack);
      localPeer.audioTrack = undefined;
    }

    await this.transport.unpublish(tracksToUnpublish);
    for (let track of tracksToUnpublish) {
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, localPeer);
    }

    if (localPeer.auxiliaryTracks && removeScreen) {
      for (const track of localPeer.auxiliaryTracks)
        if (track.source === 'screen') {
          await this.removeAuxillaryTrack(track.trackId);
        }
    }
  }
}
