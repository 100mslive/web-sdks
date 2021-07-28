import {
  HMSTrack as SDKHMSTrack,
  HMSLocalVideoTrack as SDKHMSLocalVideoTrack,
  HMSRemoteAudioTrack as SDKHMSRemoteAudioTrack,
  HMSRemoteVideoTrack as SDKHMSRemoteVideoTrack,
  HMSRoleChangeRequest as SDKHMSRoleChangeRequest,
} from '@100mslive/hms-video';
import { HMSPeer, HMSMessage, HMSTrack, HMSRoom, HMSRoleChangeStoreRequest } from '../schema';

import * as sdkTypes from './sdkTypes';
import { areArraysEqual } from './sdkUtils/storeMergeUtils';
import { HMSRole, HMSRoleName } from '../schema';

export class SDKToHMS {
  static convertPeer(sdkPeer: sdkTypes.HMSPeer): Partial<HMSPeer> & Pick<HMSPeer, 'id'> {
    return {
      id: sdkPeer.peerId,
      name: sdkPeer.name,
      roleName: sdkPeer.role?.name,
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
    SDKToHMS.enrichVideoTrack(track, sdkTrack);
  }

  static enrichVideoTrack(track: HMSTrack, sdkTrack: SDKHMSTrack) {
    if (sdkTrack instanceof SDKHMSRemoteVideoTrack) {
      track.layer = sdkTrack.getSimulcastLayer();
      track.degraded = sdkTrack.degraded;
      if (!areArraysEqual(sdkTrack.getSimulcastDefinitions(), track.layerDefinitions)) {
        track.layerDefinitions = sdkTrack.getSimulcastDefinitions();
      }
    }
    if (sdkTrack instanceof SDKHMSLocalVideoTrack) {
      if (!areArraysEqual(sdkTrack.getPlugins(), track.plugins)) {
        track.plugins = sdkTrack.getPlugins();
      }
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

  static convertRoles(sdkRoles: HMSRole[]): Record<HMSRoleName, HMSRole> {
    const roles: Record<HMSRoleName, HMSRole> = {};
    if (sdkRoles) {
      sdkRoles.forEach(role => {
        roles[role.name] = role;
      });
    }
    return roles;
  }

  static convertRoleChangeRequest(req: SDKHMSRoleChangeRequest): HMSRoleChangeStoreRequest {
    return {
      requestedBy: req.requestedBy.peerId,
      roleName: req.role.name,
      token: req.token,
    };
  }
}
