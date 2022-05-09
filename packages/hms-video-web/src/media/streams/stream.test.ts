import HMSRemoteStream from './HMSRemoteStream';
import HMSSubscribeConnection from '../../connection/subscribe';
import { HMSSimulcastLayer } from '../../interfaces';

const streamId = '123';
const nativeStream = { id: streamId } as MediaStream;

describe('HMSRemoteStream', () => {
  let stream: HMSRemoteStream;
  let sendOverApiDataChannel: jest.Mock;
  beforeEach(() => {
    sendOverApiDataChannel = jest.fn();
    const connection = { sendOverApiDataChannel } as unknown as HMSSubscribeConnection;
    stream = new HMSRemoteStream(nativeStream, connection);
  });

  const expectSubscriptionMessage = ({ audio, video }: { audio: boolean; video?: HMSSimulcastLayer }) => {
    const calls = sendOverApiDataChannel.mock.calls;
    const args = JSON.parse(calls[calls.length - 1]);
    expect(args['streamId']).toBe(streamId);
    expect(args['audio']).toBe(audio);
    expect(args['video']).toBe(video);
    expect(args['framerate']).toBe(video);
  };

  // no video is subscribed by default
  it('returns none by default for video, true for audio', () => {
    expect(stream.getSimulcastLayer()).toBe(HMSSimulcastLayer.NONE);
    expect(stream.isAudioSubscribed()).toBe(true);
  });

  it('sends data channel message when layer is switched', () => {
    stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'test');
    expect(sendOverApiDataChannel.mock.calls.length).toBe(1);
    expectSubscriptionMessage({ audio: true, video: HMSSimulcastLayer.HIGH });
  });

  it('sends message when audio is disabled', () => {
    stream.setAudio(true);
    expect(sendOverApiDataChannel.mock.calls.length).toBe(0);
    stream.setAudio(false);
    expectSubscriptionMessage({ audio: false });
  });

  it('does not send video field for audio subscription but sends audio for video', () => {
    stream.setAudio(false);
    expectSubscriptionMessage({ audio: false });
    stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'test');
    expectSubscriptionMessage({ audio: false, video: HMSSimulcastLayer.HIGH });
    stream.setAudio(true);
    expectSubscriptionMessage({ audio: true });
    stream.setVideoLayer(HMSSimulcastLayer.MEDIUM, 'test');
    expectSubscriptionMessage({ audio: true, video: HMSSimulcastLayer.MEDIUM });
  });
});
