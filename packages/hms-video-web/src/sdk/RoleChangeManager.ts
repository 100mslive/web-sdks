import { HMSRole } from '../interfaces';
import InitialSettings from '../interfaces/settings';
import HMSUpdateListener, { HMSPeerUpdate, HMSTrackUpdate } from '../interfaces/update-listener';
import ITransport from '../transport/ITransport';
import { IStore } from './store';

export default class RoleChangeManager {
  constructor(
    private store: IStore,
    private transport: ITransport,
    private publish: (settings: InitialSettings) => void,
    private removeTrack: (trackId: string) => void,
    private listener?: HMSUpdateListener,
  ) {}

  public handleLocalPeerRoleUpdate = async (event: any) => {
    const localPeer = this.store.getLocalPeer();

    if (!localPeer) {
      return;
    }
    const oldRole = event.detail.oldRole as HMSRole;
    const newRole = event.detail.newRole as HMSRole;

    const wasPublishing = oldRole.publishParams.allowed;
    const isPublishing = newRole.publishParams.allowed;

    const toRemove = {
      removeVideo: false,
      removeAudio: false,
      removeScreen: false,
    };

    if (wasPublishing) {
      // check if we have to remove any tracks
      if (!isPublishing) {
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

    if (!wasPublishing && isPublishing) {
      const initialSettings = this.store.getConfig()?.settings || {
        isAudioMuted: true,
        isVideoMuted: true,
        audioInputDeviceId: 'default',
        videoDeviceId: 'default',
        audioOutputDeviceId: 'default',
      };
      await this.publish({ ...initialSettings, isAudioMuted: true, isVideoMuted: true });
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
      localPeer.videoTrack.nativeTrack.stop();
      // TODO: stop processed track and cleanup plugins loop non async
      // vb can throw change role off otherwise
      tracksToUnpublish.push(localPeer.videoTrack);
      this.store.removeTrack(localPeer.videoTrack.trackId);
      localPeer.videoTrack = undefined;
    }

    if (localPeer?.audioTrack && removeAudio) {
      localPeer.audioTrack.nativeTrack.stop();
      tracksToUnpublish.push(localPeer.audioTrack);
      this.store.removeTrack(localPeer.audioTrack.trackId);
      localPeer.audioTrack = undefined;
    }

    await this.transport.unpublish(tracksToUnpublish);

    for (let track of tracksToUnpublish) {
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, localPeer);
    }

    if (localPeer.auxiliaryTracks && removeScreen) {
      for (const track of localPeer.auxiliaryTracks)
        if (track.source === 'screen') {
          await this.removeTrack(track.trackId);
        }
    }
  }
}
