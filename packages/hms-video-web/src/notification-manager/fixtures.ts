import {
  PeerNotification,
  PeerListNotification,
  SpeakerList,
  MessageNotification,
  PeriodicRoomState,
  PolicyParams,
} from './HMSNotifications';

export const FAKE_PEER_ID = 'peer_id_1';

export const fakePeer: PeerNotification = {
  peer_id: 'peer_id_0',
  info: { data: 'data', name: 'Sarvesh0', user_id: 'customer_user_id' },
  role: 'host',
  tracks: {},
};

export const fakePolicy: PolicyParams = {
  template_id: 'template_id_1',
  name: 'student',
  known_roles: {
    host: {
      name: 'host',
      publishParams: {
        allowed: ['audio', 'video', 'screen'],
        audio: {
          bitRate: 32,
          codec: 'opus',
        },
        video: {
          bitRate: 400,
          codec: 'vp8',
          frameRate: 30,
          width: 640,
          height: 480,
        },
        screen: {
          codec: 'vp8',
          frameRate: 10,
          width: 1920,
          height: 1080,
          bitRate: 320,
        },
        videoSimulcastLayers: { layers: [] },
        screenSimulcastLayers: { layers: [] },
      },
      subscribeParams: {
        subscribeToRoles: ['student', 'teacher', 'host', 'audio-only', '720p'],
        maxSubsBitRate: 5200,
        subscribeDegradation: {
          packetLossThreshold: 25,
          degradeGracePeriodSeconds: 1,
          recoverGracePeriodSeconds: 4,
        },
      },
      permissions: {
        endRoom: true,
        removeOthers: true,
        mute: true,
        unmute: true,
        changeRole: true,
        recording: true,
        streaming: true,
      },
      priority: 1,
    },
    viewer: {
      name: 'viewer',
      publishParams: {
        allowed: [],
        audio: {
          bitRate: 32,
          codec: 'opus',
        },
        video: {
          bitRate: 300,
          codec: 'vp8',
          frameRate: 30,
          width: 480,
          height: 360,
        },
        screen: {
          codec: 'vp8',
          frameRate: 10,
          width: 1920,
          height: 1080,
          bitRate: 320,
        },
        videoSimulcastLayers: { layers: [] },
        screenSimulcastLayers: { layers: [] },
      },
      subscribeParams: {
        subscribeToRoles: ['host', 'student', 'teacher'],
        maxSubsBitRate: 3200,
        subscribeDegradation: {
          packetLossThreshold: 25,
          degradeGracePeriodSeconds: 1,
          recoverGracePeriodSeconds: 4,
        },
      },
      permissions: {
        endRoom: true,
        removeOthers: true,
        mute: true,
        unmute: true,
        changeRole: true,
        recording: true,
        streaming: true,
      },
      priority: 1,
    },
  },
};

export const fakeRoomState: PeriodicRoomState = {
  peer_count: 2,
  room: {
    name: 'test',
    session_id: 'session_id',
    started_at: 100,
    recording: {
      sfu: { enabled: false },
      browser: { enabled: false },
      hls: { enabled: false },
    },
    streaming: {
      enabled: false,
      rtmp: { enabled: false },
      hls: { enabled: false, variants: [] },
    },
  },
  peers: {
    // optional
    [FAKE_PEER_ID]: {
      info: {
        name: 'Sarvesh1',
        data: 'data',
        user_id: 'customer_user_id',
      },
      role: 'host',
      peer_id: FAKE_PEER_ID,
      joined_at: 1639133920000,
      tracks: {},
      is_from_room_state: true,
    },
    peer_id_2: {
      info: {
        name: 'Sarvesh2',
        data: 'data',
        user_id: 'customer_user_id',
      },
      role: 'host',
      peer_id: 'peer_id_2',
      joined_at: 1639133730000,
      tracks: {},
      is_from_room_state: true,
    },
  },
};

export const fakePeerList: PeerListNotification = {
  peers: {
    [FAKE_PEER_ID]: {
      info: {
        name: 'Sarvesh1',
        data: 'data',
        user_id: 'customer_user_id',
      },
      role: 'host',
      peer_id: FAKE_PEER_ID,
      tracks: {
        track_id_1: {
          mute: true,
          type: 'audio',
          source: 'plugin',
          description: 'some description',
          track_id: 'track_id_1',
          stream_id: 'stream_id_1',
        },
        track_id_2: {
          mute: false,
          type: 'video',
          source: 'regular',
          description: '',
          track_id: 'track_id_2',
          stream_id: 'stream_id_1',
        },
      },
    },
    peer_id_3: {
      info: {
        name: 'Sarvesh3',
        data: 'data',
        user_id: 'customer_user_id',
      },
      peer_id: 'peer_id_3',
      role: 'viewer',
      tracks: {
        track_id_4: {
          mute: false,
          type: 'video',
          source: 'screen',
          description: '',
          track_id: 'track_id_4',
          stream_id: 'stream_id_3',
        },
      },
    },
  },
  room: {
    name: 'test',
    session_id: 'session_id',
    started_at: 100,
    recording: {
      sfu: { enabled: false },
      browser: { enabled: false },
      hls: { enabled: false },
    },
    streaming: {
      enabled: false,
      rtmp: { enabled: false },
      hls: { enabled: false, variants: [] },
    },
  },
};

export const fakeReconnectPeerList: PeerListNotification = {
  peers: {
    [FAKE_PEER_ID]: {
      info: {
        name: 'Sarvesh1',
        data: 'data',
        user_id: 'customer_user_id',
      },
      role: 'host',
      peer_id: FAKE_PEER_ID,
      tracks: {
        track_id_1: {
          mute: true,
          type: 'audio',
          source: 'plugin',
          description: 'some description',
          track_id: 'track_id_1',
          stream_id: 'stream_id_1',
        },
        track_id_2: {
          mute: false,
          type: 'video',
          source: 'regular',
          description: '',
          track_id: 'track_id_2',
          stream_id: 'stream_id_1',
        },
      },
    },
    peer_id_2: {
      info: {
        name: 'Sarvesh2',
        data: 'data',
        user_id: 'customer_user_id',
      },
      peer_id: 'peer_id_2',
      role: 'viewer',
      tracks: {
        track_id_3: {
          mute: false,
          type: 'video',
          source: 'screen',
          description: '',
          track_id: 'track_id_3',
          stream_id: 'stream_id_2',
        },
      },
    },
  },
  room: {
    name: 'test',
    session_id: 'session_id',
    started_at: 100,
    recording: {
      sfu: { enabled: false },
      browser: { enabled: false },
      hls: { enabled: false },
    },
    streaming: {
      enabled: false,
      rtmp: { enabled: false },
      hls: { enabled: false, variants: [] },
    },
  },
};

export const fakeSpeakerList: SpeakerList = {
  'speaker-list': [
    {
      peer_id: 'peer_id_1',
      track_id: 'track_id_1',
      level: 100,
    },
    {
      peer_id: 'peer_id_2',
      track_id: 'track_id_2',
      level: 2,
    },
  ],
};

export const fakeMessage: MessageNotification = {
  peer: {
    peer_id: FAKE_PEER_ID,
    info: {
      name: 'Sarvesh1',
      data: 'data',
      user_id: 'customer_user_id',
    },
  },
  private: false, // true if only sent to this peer
  roles: [], // empty for broadcast
  timestamp: 0,
  info: {
    message: 'Test',
    type: 'chat',
  },
};
