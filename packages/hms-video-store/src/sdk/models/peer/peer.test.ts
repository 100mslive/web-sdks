import { HMSLocalPeer } from './HMSLocalPeer';
import { HMSRemotePeer } from './HMSRemotePeer';
import { HMSPeerType } from '../../../internal';
import { PeerNotification } from '../../../notification-manager';
import decodeJWT from '../../../utils/jwt';

const validToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3Nfa2V5IjoiNWY5ZWRjNmJkMjM4MjE1YWVjNzcwMGUyIiwiYXBwX2lkIjoiNWY5ZWRjNmJkMjM4MjE1YWVjNzcwMGUxIiwicm9vbV9pZCI6IjVmY2I0ZGY2YjQ5MjQxOWE5ODVhYjIzYSIsInVzZXJfaWQiOiJhMDVmZWEzZC03YmNhLTRhY2ItODQ1Ny1mZjliZTM4NjIwMDlFZGxhIiwicm9sZSI6Ikhvc3QiLCJpYXQiOjE2MTg0NzgyMzksImV4cCI6MTYxODU2NDYzOSwiaXNzIjoiNWY5ZWRjNmJkMjM4MjE1YWVjNzcwMGRmIiwianRpIjoiZjE0OTZhNmQtMjllYy00ZGVhLWI0YmItNzZkMjcxOGY0NDJkIn0.YsBSyt52cdRfYDSeDEm-FRc4wL792eXM6PFHMtrp6i4';
const getParamsForRole = (roleName: string) => ({
  name: roleName,
  publishParams: {
    audio: { bitRate: 100, codec: 'opus' },
    video: { bitRate: 100, codec: 'vp8', frameRate: 30, width: 720, height: 1280 },
    screen: { bitRate: 100, codec: 'vp8', frameRate: 30, width: 1080, height: 1920 },
    allowed: [],
    videoSimulcastLayers: {
      layers: [],
    },
    screenSimulcastLayers: {
      layers: [],
    },
  },
  subscribeParams: {
    subscribeToRoles: [],
    maxSubsBitRate: 30,
  },
  permissions: {
    endRoom: false,
    removeOthers: false,
    unmute: false,
    mute: false,
    changeRole: false,
    hlsStreaming: false,
    rtmpStreaming: false,
    browserRecording: false,
    pollRead: false,
    pollWrite: false,
  },
  priority: 0,
});

describe('HMSLocalPeer', () => {
  const { userId, role } = decodeJWT(validToken);

  const params = {
    name: 'John Doe',
    role: getParamsForRole(role),
    customerUserId: userId,
    type: HMSPeerType.REGULAR as HMSPeerType,
  };
  const peer = new HMSLocalPeer(params);

  it('should be constructed using params', () => {
    expect(peer).toBeInstanceOf(HMSLocalPeer);
  });

  it('should have valid peerId', () => {
    expect(typeof peer.peerId).toBe('string');
  });

  it('should have valid name', () => {
    expect(peer.name).toBe(params.name);
  });

  it('should be local', () => {
    expect(peer.isLocal).toBe(true);
  });

  it('should have valid role', () => {
    expect(peer.role?.name).toBe(params.role.name);
  });

  it('should have valid customerUserId', () => {
    expect(peer.customerUserId).toBe(params.customerUserId);
  });
});

describe('HMSRemotPeer', () => {
  const peerInfo: PeerNotification = {
    peer_id: '3f18e019-5463-4c38-bcac-06f0010c43ab',
    info: {
      name: 'John Doe',
      data: 'data',
      user_id: 'customer_user_id',
      type: HMSPeerType.REGULAR,
    },
    role: 'viewer',
    tracks: {},
    groups: [],
  };
  const peer = new HMSRemotePeer({
    peerId: peerInfo.peer_id,
    name: peerInfo.info.name,
    role: getParamsForRole(peerInfo.role),
    customerUserId: peerInfo.info.user_id,
    metadata: peerInfo.info.data,
    type: HMSPeerType.REGULAR,
  });

  it('should be constructed using params', () => {
    expect(peer).toBeInstanceOf(HMSRemotePeer);
  });

  it('should have valid peerId', () => {
    expect(peer.peerId).toBe(peerInfo.peer_id);
  });

  it('should have valid name', () => {
    expect(peer.name).toBe(peerInfo.info.name);
  });

  it('should be remote', () => {
    expect(peer.isLocal).toBe(false);
  });

  it('should have valid role', () => {
    expect(peer.role?.name).toBe(peerInfo.role);
  });

  it('should have valid customerUserId', () => {
    expect(peer.customerUserId).toBe(peerInfo.info.user_id);
  });
});
