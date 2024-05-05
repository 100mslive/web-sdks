import { MessageNotification, PeerListNotification, PeerNotification, SpeakerList } from './HMSNotifications';
import { HMSPeerType } from '../interfaces';

export const FAKE_PEER_ID = 'peer_id_1';

export const fakePeer: PeerNotification = {
  peer_id: 'peer_id_0',
  info: { data: 'data', name: 'Sarvesh0', user_id: 'customer_user_id', type: HMSPeerType.REGULAR },
  role: 'host',
  tracks: {},
  groups: [],
};

export const fakePeerList: PeerListNotification = {
  peers: {
    [FAKE_PEER_ID]: {
      info: {
        name: 'Sarvesh1',
        data: 'data',
        user_id: 'customer_user_id',
        type: HMSPeerType.REGULAR,
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
          source: HMSPeerType.REGULAR,
          description: '',
          track_id: 'track_id_2',
          stream_id: 'stream_id_1',
        },
      },
      groups: [],
    },
    peer_id_3: {
      info: {
        name: 'Sarvesh3',
        data: 'data',
        user_id: 'customer_user_id',
        type: HMSPeerType.REGULAR,
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
      groups: [],
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
        type: HMSPeerType.REGULAR,
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
          source: HMSPeerType.REGULAR,
          description: '',
          track_id: 'track_id_2',
          stream_id: 'stream_id_1',
        },
      },
      groups: [],
    },
    peer_id_2: {
      info: {
        name: 'Sarvesh2',
        data: 'data',
        user_id: 'customer_user_id',
        type: HMSPeerType.REGULAR,
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
      groups: [],
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
    role: 'test',
    groups: [],
  },
  private: false, // true if only sent to this peer
  roles: [], // empty for broadcast
  timestamp: 0,
  info: {
    message: 'Test',
    type: 'chat',
  },
  message_id: 'test',
};
