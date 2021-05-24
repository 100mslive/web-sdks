import { HMSPeer, HMSMessage, HMSTrack, HMSRoom } from '../schema';
import SDKHMSTrack from '@100mslive/100ms-web-sdk/dist/media/tracks/HMSTrack';

import * as sdkTypes from './sdkTypes';

export class SDKToHMS {
  static convertPeer(
    sdkPeer: sdkTypes.HMSPeer,
  ): Partial<HMSPeer> & Pick<HMSPeer, 'id'> {
    return {
      id: sdkPeer.peerId,
      name: sdkPeer.name,
      role: sdkPeer.role,
      isLocal: sdkPeer.isLocal,
      videoTrack: sdkPeer.videoTrack?.trackId,
      audioTrack: sdkPeer.audioTrack?.trackId,
      auxiliaryTracks: sdkPeer.auxiliaryTracks.map(t => t.trackId),
    };
  }

  static convertTrack(sdkTrack: SDKHMSTrack): HMSTrack {
    return {
      id: sdkTrack.trackId,
      source: sdkTrack.source,
      type: sdkTrack.type,
      enabled: sdkTrack.enabled,
    };
  }

  static convertRoom(sdkRoom: sdkTypes.HMSRoom): Partial<HMSRoom> {
    return {
      id: sdkRoom.id,
      name: sdkRoom.name,
      hasWaitingRoom: sdkRoom.hasWaitingRoom,
      shareableLink: sdkRoom.shareableLink,
    }
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
