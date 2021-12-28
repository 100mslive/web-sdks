import {
  HMSLocalAudioTrack as SDKHMSLocalAudioTrack,
  HMSLocalVideoTrack as SDKHMSLocalVideoTrack,
  HMSPeerConnectionStats,
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
      hls: { running: !!sdkRoom.hls?.running, variants: sdkRoom.hls?.variants || [] },
      sessionId: sdkRoom.sessionId,
      startedAt: sdkRoom.startedAt && new Date(sdkRoom.startedAt),
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

  static convertConnectionStats(stats: HMSPeerConnectionStats) {
    const serialized: any = { ...stats };
    delete serialized['rawStatsArray'];
    delete serialized['rawStats'];
    return serialized;
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
    recording: sdkTypes.HMSRecording | undefined,
    rtmp: sdkTypes.HMSRTMP | undefined,
    hls: sdkTypes.HMSHLS | undefined,
  ): { recording: sdkTypes.HMSRecording; rtmp: sdkTypes.HMSRTMP; hls: sdkTypes.HMSHLS } {
    return {
      recording: {
        browser: {
          running: !!recording?.browser?.running,
        },
        server: { running: !!recording?.server?.running },
      },
      rtmp: { running: !!rtmp?.running },
      hls: { variants: hls?.variants || [], running: !!hls?.running },
    };
  }
}
