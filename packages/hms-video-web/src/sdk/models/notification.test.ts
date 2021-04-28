import { Peer, PeerList } from './HMSNotifications';

describe('Peer', () => {
  const params = {
    peer_id: '3f18e019-5463-4c38-bcac-06f0010c43ab',
    info: {
      name: 'John Doe',
      data: 'data',
      user_id: 'customer_user_id',
    },
    role: 'viewer',
  };
  const peer = new Peer(params);

  it('should be constructed using params', () => {
    expect(peer).toBeInstanceOf(Peer);
  });

  it('should have role', () => {
    expect(peer.role).toBe(params.role);
  });

  it('should have valid peerId', () => {
    expect(peer.peerId).toBe(params.peer_id);
  });

  it('should have name in the info', () => {
    expect(peer.info.name).toBe(params.info.name);
  });

  it('should have userId in the info', () => {
    expect(peer.info.userId).toBe(params.info.user_id);
  });

  it('should have custom data in the info', () => {
    expect(peer.info.data).toBe(params.info.data);
  });

  it('should have tracks as empty array or array of type TrackState', () => {
    expect(peer.tracks).toBeInstanceOf(Array);
  });
});

describe('PeerList', () => {
  const params = {
    peers: {
      peer_id_1: {
        info: {
          name: 'Sarvesh1',
          data: 'data',
          user_id: 'customer_user_id',
        },
        role: 'host',
        peer_id: 'peer_id_1',
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
  };
  const peerList: PeerList = new PeerList(params);

  it('should be constructed using params', () => {
    expect(peerList).toBeInstanceOf(PeerList);
  });

  it('should have as many number of peers as sent in peer-list', () => {
    expect(peerList.peers.length).toBe(2);
  });

  it('should have peers which are instances of Peer', () => {
    peerList.peers.forEach((peer) => {
      expect(peer).toBeInstanceOf(Peer);
    });
  });

  it('should have appropriate roles', () => {
    expect(peerList.peers[0].role).toBe('host');
    expect(peerList.peers[1].role).toBe('viewer');
  });
});
