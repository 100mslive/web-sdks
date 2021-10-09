import {
  HMSTrack as SDKHMSTrack,
  HMSLocalVideoTrack as SDKHMSLocalVideoTrack,
  HMSLocalAudioTrack as SDKHMSLocalAudioTrack,
  HMSRemoteAudioTrack as SDKHMSRemoteAudioTrack,
  HMSRemoteVideoTrack as SDKHMSRemoteVideoTrack,
  HMSRoleChangeRequest as SDKHMSRoleChangeRequest,
} from '@100mslive/hms-video';
import {
  HMSPeer,
  HMSMessage,
  HMSTrack,
  HMSRoom,
  HMSRoleChangeStoreRequest,
  HMSException,
  HMSDeviceChangeEvent,
  HMSPlaylistItem,
  HMSPlaylistType,
  HMSPeerID,
} from '../schema';

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

  static convertTrack(sdkTrack: SDKHMSTrack, peerId?: HMSPeerID): HMSTrack {
    const track: HMSTrack = {
      id: sdkTrack.trackId,
      source: sdkTrack.source,
      type: sdkTrack.type,
      enabled: sdkTrack.enabled,
      displayEnabled: sdkTrack.enabled,
      peerId: sdkTrack.peerId || peerId,
    };
    this.enrichTrack(track, sdkTrack);
    return track;
  }

  static enrichTrack(track: HMSTrack, sdkTrack: SDKHMSTrack) {
    const mediaSettings = sdkTrack.getMediaTrackSettings();
    if (track.source === 'screen' && track.type === 'video') {
      // @ts-ignore
      track.displaySurface = mediaSettings.displaySurface;
    }
    track.height = mediaSettings.height;
    track.width = mediaSettings.width;
    track.deviceID = mediaSettings.deviceId;
    if (sdkTrack instanceof SDKHMSRemoteAudioTrack) {
      const volume = sdkTrack.getVolume() || 0;
      track.volume = volume;
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
    if (sdkTrack instanceof SDKHMSLocalVideoTrack || sdkTrack instanceof SDKHMSLocalAudioTrack) {
      if (!areArraysEqual(sdkTrack.getPlugins(), track.plugins)) {
        track.plugins = sdkTrack.getPlugins();
      }
    }
  }

  static convertRoom(sdkRoom: sdkTypes.HMSRoom): Partial<HMSRoom> {
    return {
      id: sdkRoom.id,
      name: sdkRoom.name,
      localPeer: sdkRoom.localPeer?.peerId ?? '',
      hasWaitingRoom: sdkRoom.hasWaitingRoom,
      shareableLink: sdkRoom.shareableLink,
      recording: {
        browser: {
          running: !!sdkRoom.recording?.browser.running,
        },
        server: { running: !!sdkRoom.recording?.server.running },
      },
      rtmp: { running: !!sdkRoom.rtmp?.running },
    };
  }

  static convertMessage(
    sdkMessage: sdkTypes.HMSMessage,
  ): Partial<HMSMessage> & Pick<HMSMessage, 'sender'> {
    return {
      sender: sdkMessage.sender.peerId,
      senderName: sdkMessage.sender.name,
      senderRole: sdkMessage.sender.role?.name,
      senderUserId: sdkMessage.sender.customerUserId,
      recipientPeer: sdkMessage.recipientPeer?.peerId,
      recipientRoles: sdkMessage.recipientRoles?.map(role => role.name),
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

  static convertException(sdkException: sdkTypes.HMSException): HMSException {
    return {
      code: sdkException.code,
      action: sdkException.action,
      name: sdkException.name,
      message: sdkException.message,
      description: sdkException.description,
      isTerminal: sdkException.isTerminal,
      nativeError: sdkException.nativeError,
      timestamp: new Date(),
    };
  }

  static convertDeviceChangeUpdate(
    sdkDeviceChangeEvent: sdkTypes.HMSDeviceChangeEvent,
  ): HMSDeviceChangeEvent {
    const convertedData: HMSDeviceChangeEvent = {
      devices: sdkDeviceChangeEvent.devices,
      selection: sdkDeviceChangeEvent.selection,
      type: sdkDeviceChangeEvent.type,
    };
    if (sdkDeviceChangeEvent.error) {
      convertedData.error = this.convertException(sdkDeviceChangeEvent.error);
    }
    return convertedData;
  }

  static convertPlaylist(playlistManager: sdkTypes.HMSPlaylistManager) {
    const audioPlaylist = this.getConvertedPlaylistType(playlistManager, HMSPlaylistType.audio);
    const videoPlaylist = this.getConvertedPlaylistType(playlistManager, HMSPlaylistType.video);
    return { audio: audioPlaylist, video: videoPlaylist };
  }

  private static getConvertedPlaylistType(
    playlistManager: sdkTypes.HMSPlaylistManager,
    type: HMSPlaylistType,
  ) {
    const convertedPlaylist: Record<string, HMSPlaylistItem<any>> = {};
    const currentSelection = playlistManager.getCurrentSelection(type);
    const progress = playlistManager.getCurrentProgress(type);
    const isPlaying = playlistManager.isPlaying(type);
    const volume = playlistManager.getVolume(type);
    const list = playlistManager.getList(type);
    const currentIndex = playlistManager.getCurrentIndex(type);

    playlistManager.getList(type).forEach(playlistItem => {
      const isSelected = playlistItem.url === currentSelection?.url;
      convertedPlaylist[playlistItem.id] = {
        ...playlistItem,
        type: playlistItem.type as HMSPlaylistType,
        selected: isSelected,
        playing: isSelected && isPlaying,
      };
    });
    return {
      list: convertedPlaylist,
      selection: {
        id: currentSelection?.id,
        hasPrevious: currentIndex > 0,
        hasNext: currentIndex < list.length - 1,
      },
      progress,
      volume,
      currentTime: playlistManager.getCurrentTime(type),
    };
  }

  static convertRecordingRTMPState(
    recording: sdkTypes.HMSRecording | undefined,
    rtmp: sdkTypes.HMSRTMP | undefined,
  ): { recording: sdkTypes.HMSRecording; rtmp: sdkTypes.HMSRTMP } {
    return {
      recording: {
        browser: {
          running: !!recording?.browser?.running,
        },
        server: { running: !!recording?.server?.running },
      },
      rtmp: { running: !!rtmp?.running },
    };
  }
}
