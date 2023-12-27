import { Store } from './store';
import { DeviceManager } from '../device-manager';
import { HMSRole } from '../interfaces';
import InitialSettings from '../interfaces/settings';
import { SimulcastLayers } from '../interfaces/simulcast-layers';
import { HMSPeerUpdate, HMSTrackUpdate, HMSUpdateListener } from '../interfaces/update-listener';
import { HMSLocalTrack } from '../media/tracks';
import HMSTransport from '../transport';

export default class RoleChangeManager {
  constructor(
    private store: Store,
    private transport: HMSTransport,
    private deviceManager: DeviceManager,
    private publish: (settings: InitialSettings) => Promise<void>,
    private removeAuxiliaryTrack: (trackId: string) => void,
    private listener?: HMSUpdateListener,
  ) {}

  handleLocalPeerRoleUpdate = async ({ oldRole, newRole }: { oldRole: HMSRole; newRole: HMSRole }) => {
    const localPeer = this.store.getLocalPeer();

    if (!localPeer) {
      return;
    }

    await this.diffRolesAndPublishTracks({ oldRole, newRole });
    this.listener?.onPeerUpdate(HMSPeerUpdate.ROLE_UPDATED, localPeer);
  };

  diffRolesAndPublishTracks = async ({ oldRole, newRole }: { oldRole: HMSRole; newRole: HMSRole }) => {
    const wasPublishing = new Set(oldRole.publishParams.allowed);
    const isPublishing = new Set(newRole.publishParams.allowed);

    const removeVideo = this.removeTrack(wasPublishing, isPublishing, 'video');

    const removeAudio = this.removeTrack(wasPublishing, isPublishing, 'audio');
    const removeScreen = this.removeTrack(wasPublishing, isPublishing, 'screen');

    const videoHasSimulcastDifference = this.hasSimulcastDifference(
      oldRole.publishParams.simulcast?.video,
      newRole.publishParams.simulcast?.video,
    );
    const screenHasSimulcastDifference = this.hasSimulcastDifference(
      oldRole.publishParams.simulcast?.screen,
      newRole.publishParams.simulcast?.screen,
    );

    const prevVideoEnabled = this.store.getLocalPeer()?.videoTrack?.enabled;

    await this.removeAudioTrack(removeAudio);
    await this.removeVideoTracks(removeVideo || videoHasSimulcastDifference);
    await this.removeScreenTracks(removeScreen || screenHasSimulcastDifference);

    const settings = this.getSettings();

    if (videoHasSimulcastDifference) {
      settings.isVideoMuted = !prevVideoEnabled;
    }

    // call publish with new settings, local track manager will diff policies
    await this.publish(settings);
    await this.syncDevices(settings, newRole);
  };

  private async syncDevices(initialSettings: InitialSettings, newRole: HMSRole) {
    if ((!initialSettings.isAudioMuted || !initialSettings.isVideoMuted) && newRole.publishParams.allowed.length > 0) {
      await this.deviceManager.init(true);
    }
  }
  private async removeVideoTracks(removeVideo: boolean) {
    if (!removeVideo) {
      return;
    }
    const localPeer = this.store.getLocalPeer();
    // TODO check auxillary tracks for regular audio and video too
    if (localPeer?.videoTrack) {
      // TODO: stop processed track and cleanup plugins loop non async
      // vb can throw change role off otherwise
      if (localPeer.videoTrack.isPublished) {
        await this.transport.unpublish([localPeer.videoTrack]);
      } else {
        await localPeer.videoTrack.cleanup();
      }
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
      if (localPeer.audioTrack.isPublished) {
        await this.transport.unpublish([localPeer.audioTrack]);
      } else {
        await localPeer.audioTrack.cleanup();
      }
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

  private hasSimulcastDifference(oldLayers?: SimulcastLayers, newLayers?: SimulcastLayers) {
    if (!oldLayers && !newLayers) {
      return false;
    }
    if (oldLayers?.layers?.length !== newLayers?.layers?.length) {
      return true;
    }

    // return true if anyone layer has different maxBitrate/maxFramerate
    return !!oldLayers?.layers?.some(layer => {
      const newLayer = newLayers?.layers?.find(newLayer => newLayer.rid === layer.rid);
      return newLayer?.maxBitrate !== layer.maxBitrate || newLayer?.maxFramerate !== layer.maxFramerate;
    });
  }

  private getSettings(): InitialSettings {
    const initialSettings = this.store.getConfig()?.settings;

    return {
      isAudioMuted: initialSettings?.isAudioMuted ?? true,
      isVideoMuted: initialSettings?.isVideoMuted ?? true,
      audioInputDeviceId: initialSettings?.audioInputDeviceId || 'default',
      audioOutputDeviceId: initialSettings?.audioOutputDeviceId || 'default',
      videoDeviceId: initialSettings?.videoDeviceId || 'default',
    };
  }
}
