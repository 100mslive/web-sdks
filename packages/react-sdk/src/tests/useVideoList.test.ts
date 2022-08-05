import { useVideoList } from '../hooks/useVideoList';
import { renderHook } from '@testing-library/react-hooks';
import expect from 'expect';

test('render useVideoList Hook', () => {
  const x = renderHook(() => useVideoList({ peers }));
  expect(x).toBe({});
});

const peers = [
  {
    id: '463c7ffc-a08e-4be4-a135-5395a2ce8939',
    name: 'Deep',
    roleName: 'guest',
    isLocal: true,
    videoTrack: 'bc95887e-65dd-4a97-8d16-fe8a78295354',
    audioTrack: '9a6bd769-cc78-4e4a-a85d-cbe0dde20604',
    auxiliaryTracks: [],
    customerUserId: '8296b606-47fc-41f7-ac43-ea7b6b3f0e3a',
    customerDescription: '',
    metadata: '',
    joinedAt: new Date(),
  },
  {
    id: '8f47b8b5-7779-49e1-822f-6b0b296d0314',
    name: 'Deep',
    roleName: 'host',
    isLocal: false,
    videoTrack: 'e04f4e85-c939-4e40-823d-bd35e6f37f91',
    audioTrack: 'f6e4cfbe-fe7c-422a-89a8-fa76cd15d887',
    auxiliaryTracks: [],
    customerUserId: '07a4997d-8410-472b-8411-abf0a98396d1',
    customerDescription: '',
    metadata: '',
    joinedAt: new Date(),
  },
];
