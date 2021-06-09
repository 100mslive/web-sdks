import {
  HMSMessageType,
  HMSStore,
  HMSTrack,
  HMSTrackID,
  HMSTrackSource,
  HMSTrackType,
} from '../core';

function makeTrack(
  id: HMSTrackID,
  type: HMSTrackType,
  source: HMSTrackSource,
  enabled?: boolean,
): HMSTrack {
  return {
    id: id,
    source: source,
    type: type,
    enabled: !!enabled,
    displayEnabled: true,
  };
}

export const makeFakeStore = (): HMSStore => {
  return {
    room: {
      id: '123',
      isConnected: true,
      name: 'test room',
      peers: ['1', '2'],
      shareableLink: '',
      hasWaitingRoom: false,
    },
    peers: {
      '1': {
        id: '1',
        name: 'test1',
        role: 'student',
        isLocal: true,
        videoTrack: '101',
        audioTrack: '102',
        auxiliaryTracks: [],
      },
      '2': {
        id: '2',
        name: 'test2',
        role: 'student',
        isLocal: false,
        videoTrack: '103',
        audioTrack: '104',
        auxiliaryTracks: ['105'],
      },
    },
    tracks: {
      '101': makeTrack('101', 'video', 'regular'),
      '102': makeTrack('102', 'audio', 'regular'),
      '103': makeTrack('103', 'video', 'regular'),
      '104': makeTrack('104', 'audio', 'regular'),
      '105': makeTrack('105', 'video', 'screen'),
    },
    messages: {
      byID: {
        '201': {
          id: '201',
          sender: '1',
          read: true,
          type: HMSMessageType.CHAT,
          message: 'hello!',
          time: new Date(),
        },
        '202': {
          id: '202',
          sender: '2',
          read: false,
          type: HMSMessageType.CHAT,
          message: 'hi!',
          time: new Date(),
        },
      },
      allIDs: ['201', '202'],
    },
    speakers: {
      '1': {
        audioLevel: 75,
      },
    },
    settings: {
      audioInputDeviceId: 'testAudioIn',
      audioOutputDeviceId: 'testAudioOut',
      videoInputDeviceId: 'testVideoIn',
      maxTileCount: 12,
    },
  };
};
