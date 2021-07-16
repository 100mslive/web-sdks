import {
  HMSTrack as SDKHMSTrack,
  HMSRemoteAudioTrack as SDKHMSRemoteAudioTrack,
  HMSRemoteVideoTrack as SDKHMSRemoteVideoTrack,
} from '@100mslive/hms-video';
import { HMSPeer, HMSMessage, HMSTrack, HMSRoom } from '../schema';

import * as sdkTypes from './sdkTypes';

export class SDKToHMS {
  static convertPeer(sdkPeer: sdkTypes.HMSPeer): Partial<HMSPeer> & Pick<HMSPeer, 'id'> {
    return {
      id: sdkPeer.peerId,
      name: sdkPeer.name,
      role: sdkPeer.role,
      isLocal: sdkPeer.isLocal,
      videoTrack: sdkPeer.videoTrack?.trackId,
      audioTrack: sdkPeer.audioTrack?.trackId,
      auxiliaryTracks: sdkPeer.auxiliaryTracks.map(t => t.trackId),
      customerUserId: sdkPeer.customerUserId,
      customerDescription: sdkPeer.customerDescription,
    };
  }

  static convertTrack(sdkTrack: SDKHMSTrack): HMSTrack {
    const track: HMSTrack = {
      id: sdkTrack.trackId,
      source: sdkTrack.source,
      type: sdkTrack.type,
      enabled: sdkTrack.enabled,
      displayEnabled: sdkTrack.enabled,
      processors: sdkTrack.processors,
    };
    this.enrichTrack(track, sdkTrack);
    return track;
  }

  static enrichTrack(track: HMSTrack, sdkTrack: SDKHMSTrack) {
    const mediaSettings = sdkTrack.getMediaTrackSettings();
    track.height = mediaSettings.height;
    track.width = mediaSettings.width;
    track.deviceID = mediaSettings.deviceId;
    if (sdkTrack instanceof SDKHMSRemoteAudioTrack) {
      const volume = sdkTrack.getVolume();
      if (volume) {
        track.volume = volume;
      }
    }
    if (sdkTrack instanceof SDKHMSRemoteVideoTrack) {
      track.layer = sdkTrack.getSimulcastLayer();
    }
  }

  static convertRoom(sdkRoom: sdkTypes.HMSRoom): Partial<HMSRoom> {
    return {
      id: sdkRoom.id,
      name: sdkRoom.name,
      hasWaitingRoom: sdkRoom.hasWaitingRoom,
      shareableLink: sdkRoom.shareableLink,
    };
  }

  static convertMessage(
    sdkMessage: sdkTypes.HMSMessage,
  ): Partial<HMSMessage> & Pick<HMSMessage, 'sender'> {
    return {
      sender: sdkMessage.sender,
      time: sdkMessage.time,
      type: sdkMessage.type,
      message: sdkMessage.message,
    };
  }
}
