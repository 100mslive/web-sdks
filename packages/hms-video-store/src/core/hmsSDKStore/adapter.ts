import {
  HMSLocalAudioTrack as SDKHMSLocalAudioTrack,
  HMSLocalVideoTrack as SDKHMSLocalVideoTrack,
  HMSRemoteAudioTrack as SDKHMSRemoteAudioTrack,
  HMSRemoteVideoTrack as SDKHMSRemoteVideoTrack,
  HMSRoleChangeRequest as SDKHMSRoleChangeRequest,
  HMSTrack as SDKHMSTrack,
} from '@100mslive/hms-video';
import {
  HMSDeviceChangeEvent,
  HMSException,
  HMSMessage,
  HMSPeer,
  HMSPeerID,
  HMSPlaylistItem,
  HMSPlaylistType,
  HMSRole,
  HMSRoleChangeStoreRequest,
  HMSRoleName,
  HMSRoom,
  HMSTrack,
} from '../schema';

import * as sdkTypes from './sdkTypes';
import { areArraysEqual } from './sdkUtils/storeMergeUtils';

/**
 * This file has conversion functions from schema defined in sdk to normalised schema defined in store.
 * A lot of conversions below involve deep clone as once the object goes into store it becomes unmodifiable
 * due to immer, so it can't be mutated later.
 *
 * Objects directly from the SDK are not stored as is and cloned because the SDK might modify it later
 */

export class SDKToHMS {
  static convertPeer(sdkPeer: sdkTypes.HMSPeer): Partial<HMSPeer> & Pick<HMSPeer, 'id'> {
    return {
      id: sdkPeer.peerId,
      name: sdkPeer.name,
      roleName: sdkPeer.role?.name,
      isLocal: sdkPeer.isLocal,
      videoTrack: sdkPeer.videoTrack?.trackId,
      audioTrack: sdkPeer.audioTrack?.trackId,
      auxiliaryTracks: sdkPeer.auxiliaryTracks.map(track => track.trackId),
      customerUserId: sdkPeer.customerUserId,
      customerDescription: sdkPeer.metadata,
      metadata: sdkPeer.metadata,
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
    if (sdkTrack instanceof SDKHMSRemoteAudioTrack) {
      track.volume = sdkTrack.getVolume() || 0;
    }
    SDKToHMS.updateDeviceID(track, sdkTrack);
    SDKToHMS.enrichVideoTrack(track, sdkTrack);
    SDKToHMS.enrichPluginsDetails(track, sdkTrack);
  }

  static updateDeviceID(track: HMSTrack, sdkTrack: SDKHMSTrack) {
    if (sdkTrack instanceof SDKHMSLocalVideoTrack || sdkTrack instanceof SDKHMSLocalAudioTrack) {
      track.deviceID = sdkTrack.settings.deviceId;
    } else {
      track.deviceID = sdkTrack.getMediaTrackSettings()?.deviceId;
    }
  }

  static enrichVideoTrack(track: HMSTrack, sdkTrack: SDKHMSTrack) {
    if (sdkTrack instanceof SDKHMSRemoteVideoTrack) {
      track.layer = sdkTrack.getSimulcastLayer();
      track.degraded = sdkTrack.degraded;
      if (!areArraysEqual(sdkTrack.getSimulcastDefinitions(), track.layerDefinitions)) {
        track.layerDefinitions = sdkTrack.getSimulcastDefinitions();
      }
    }
  }

  static enrichPluginsDetails(track: HMSTrack, sdkTrack: SDKHMSTrack) {
    if (sdkTrack instanceof SDKHMSLocalVideoTrack || sdkTrack instanceof SDKHMSLocalAudioTrack) {
      if (!areArraysEqual(sdkTrack.getPlugins(), track.plugins)) {
        track.plugins = sdkTrack.getPlugins();
      }
    }
  }

  static convertRoom(sdkRoom: sdkTypes.HMSRoom): Partial<HMSRoom> {
    const { recording, rtmp, hls } = SDKToHMS.convertRecordingStreamingState(
      sdkRoom?.recording,
      sdkRoom?.rtmp,
      sdkRoom?.hls,
    );
    return {
      id: sdkRoom.id,
      name: sdkRoom.name,
      localPeer: sdkRoom.localPeer?.peerId ?? '',
      hasWaitingRoom: sdkRoom.hasWaitingRoom,
      shareableLink: sdkRoom.shareableLink,
      recording,
      rtmp,
      hls,
      sessionId: sdkRoom.sessionId,
      startedAt: sdkRoom.startedAt,
      peerCount: sdkRoom.peerCount,
    };
  }

  static convertMessage(sdkMessage: sdkTypes.HMSMessage): Partial<HMSMessage> & Pick<HMSMessage, 'sender'> {
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
      requestedBy: req.requestedBy?.peerId,
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

  static convertDeviceChangeUpdate(sdkDeviceChangeEvent: sdkTypes.HMSDeviceChangeEvent): HMSDeviceChangeEvent {
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

  static convertPlaylistItem<T>(
    playlistManager: sdkTypes.HMSPlaylistManager,
    playlistItem: sdkTypes.HMSPlaylistItem<T>,
  ): HMSPlaylistItem<T> {
    const type = playlistItem.type;
    const currentSelection = playlistManager.getCurrentSelection(type);
    const isPlaying = playlistManager.isPlaying(type);
    const isSelected = playlistItem.url === currentSelection?.url;

    return {
      ...playlistItem,
      type: playlistItem.type as HMSPlaylistType,
      selected: isSelected,
      playing: isSelected && isPlaying,
    };
  }

  private static getConvertedPlaylistType(playlistManager: sdkTypes.HMSPlaylistManager, type: HMSPlaylistType) {
    const convertedPlaylist: Record<string, HMSPlaylistItem<any>> = {};
    const currentSelection = playlistManager.getCurrentSelection(type);
    const progress = playlistManager.getCurrentProgress(type);
    const volume = playlistManager.getVolume(type);
    const list = playlistManager.getList(type);
    const currentIndex = playlistManager.getCurrentIndex(type);

    playlistManager.getList(type).forEach(playlistItem => {
      convertedPlaylist[playlistItem.id] = SDKToHMS.convertPlaylistItem(playlistManager, playlistItem);
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
      playbackRate: playlistManager.getPlaybackRate(type),
    };
  }

  static convertRecordingStreamingState(
    recording?: sdkTypes.HMSRecording,
    rtmp?: sdkTypes.HMSRTMP,
    hls?: sdkTypes.HMSHLS,
  ): { recording: sdkTypes.HMSRecording; rtmp: sdkTypes.HMSRTMP; hls: sdkTypes.HMSHLS } {
    return {
      recording: {
        browser: {
          running: !!recording?.browser?.running,
          startedAt: recording?.browser?.startedAt,
          error: recording?.browser?.error,
        },
        server: {
          running: !!recording?.server?.running,
          startedAt: recording?.server?.startedAt,
          error: recording?.server?.error,
        },
      },
      rtmp: {
        running: !!rtmp?.running,
        startedAt: rtmp?.startedAt,
        error: rtmp?.error,
      },
      hls: {
        variants: hls?.variants?.map(variant => variant) || [],
        running: !!hls?.running,
        error: hls?.error,
      },
    };
  }
}
