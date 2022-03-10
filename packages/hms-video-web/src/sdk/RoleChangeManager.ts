import { HMSRole } from '../interfaces';
import InitialSettings from '../interfaces/settings';
import { HMSPeerUpdate, HMSTrackUpdate, HMSUpdateListener } from '../interfaces/update-listener';
import { HMSLocalTrack } from '../media/tracks';
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
    private removeAuxiliaryTrack: (trackId: string) => void,
    private listener?: HMSUpdateListener,
  ) {}

  public handleLocalPeerRoleUpdate = async ({ oldRole, newRole }: { oldRole: HMSRole; newRole: HMSRole }) => {
    const localPeer = this.store.getLocalPeer();

    if (!localPeer) {
      return;
    }

    const wasPublishing = new Set(oldRole.publishParams.allowed || []);
    const isPublishing = new Set(newRole.publishParams.allowed || []);

    const removeVideo = this.removeTrack(wasPublishing, isPublishing, 'video');
    const removeAudio = this.removeTrack(wasPublishing, isPublishing, 'audio');
    const removeScreen = this.removeTrack(wasPublishing, isPublishing, 'screen');

    await this.removeVideoTracks(removeVideo);
    await this.removeAudioTrack(removeAudio);
    await this.removeScreenTracks(removeScreen);
    this.store.setPublishParams(newRole.publishParams);

    const initialSettings = this.store.getConfig()?.settings || {
      isAudioMuted: true,
      isVideoMuted: true,
      audioInputDeviceId: 'default',
      videoDeviceId: 'default',
      audioOutputDeviceId: 'default',
    };
    // call publish with new settings, local track manager will diff policies
    await this.publish({ ...initialSettings, isAudioMuted: true, isVideoMuted: true });

    this.listener?.onPeerUpdate(HMSPeerUpdate.ROLE_UPDATED, localPeer);
  };

  private async removeVideoTracks(removeVideo: boolean) {
    if (!removeVideo) {
      return;
    }
    const localPeer = this.store.getLocalPeer();
    // TODO check auxillary tracks for regular audio and video too
    if (localPeer?.videoTrack) {
      // TODO: stop processed track and cleanup plugins loop non async
      // vb can throw change role off otherwise
      await this.transport.unpublish([localPeer.videoTrack]);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, localPeer.videoTrack, localPeer);
      localPeer.videoTrack = undefined;
    }
    await this.removeAuxTracks(track => track.source !== 'screen' && track.type === 'video');
  }

  private async removeAudioTrack(removeAudio: boolean) {
    if (!removeAudio) {
      return;
    }
    const localPeer = this.store.getLocalPeer();
    if (localPeer?.audioTrack) {
      await this.transport.unpublish([localPeer.audioTrack]);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, localPeer.audioTrack, localPeer);
      localPeer.audioTrack = undefined;
    }
    await this.removeAuxTracks(track => track.source !== 'screen' && track.type === 'audio');
  }

  private async removeScreenTracks(removeScreen: boolean) {
    if (!removeScreen) {
      return;
    }
    await this.removeAuxTracks(track => track.source === 'screen');
  }

  private async removeAuxTracks(predicate: (track: HMSLocalTrack) => boolean) {
    const localPeer = this.store.getLocalPeer();
    if (localPeer?.auxiliaryTracks) {
      const localAuxTracks = [...localPeer.auxiliaryTracks];
      for (const track of localAuxTracks) {
        if (predicate(track)) {
          await this.removeAuxiliaryTrack(track.trackId);
        }
      }
    }
  }

  private removeTrack(wasPublishing: Set<string>, isPublishing: Set<string>, type: string) {
    return wasPublishing.has(type) && !isPublishing.has(type);
  }
}
