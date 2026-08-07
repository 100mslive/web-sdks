import HMSPublishConnection from '../../connection/publish/publishConnection';
import { EventBus } from '../../events/EventBus';
import { HMSLocalAudioTrack, HMSLocalStream } from '../../internal';
import { HMSAudioTrackSettingsBuilder } from '../settings';

// jsdom has no AudioContext, HMSAudioPluginsManager creates one in the constructor
beforeAll(() => {
  (global as any).AudioContext = jest.fn(() => ({
    createMediaStreamSource: jest.fn(),
    createMediaStreamDestination: jest.fn(),
  }));
});

const makeLocalAudioTrack = (eventBus: EventBus) => {
  const nativeStream = { id: 'stream-1', getTracks: () => [] } as unknown as MediaStream;
  const stream = new HMSLocalStream(nativeStream);
  stream.setConnection({} as unknown as HMSPublishConnection);
  const nativeTrack = {
    id: 'track-1',
    kind: 'audio',
    enabled: true,
    getSettings: jest.fn(() => ({})),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  } as unknown as MediaStreamTrack;
  const settings = new HMSAudioTrackSettingsBuilder().build();
  return new HMSLocalAudioTrack(stream, nativeTrack, 'regular', eventBus, settings);
};

describe('HMSLocalAudioTrack interruption events', () => {
  it('publishes an interruption on native mute and unmute', async () => {
    const eventBus = new EventBus();
    const interruptions: { started: boolean; reason: string; trackId: string }[] = [];
    eventBus.audioInterruption.subscribe(interruption => interruptions.push(interruption));

    const track = makeLocalAudioTrack(eventBus);
    jest.spyOn(track, 'setEnabled').mockResolvedValue(undefined);

    (track as any).handleTrackMute();
    await track.handleTrackUnmute();

    expect(interruptions).toEqual([
      { started: true, reason: 'track-muted-natively', trackId: track.trackId },
      { started: false, reason: 'track-unmuted-natively', trackId: track.trackId },
    ]);
  });
});
