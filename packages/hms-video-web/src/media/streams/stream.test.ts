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

  // no video is subscribed by default
  it('returns none by default for video, true for audio', () => {
    expect(stream.getSimulcastLayer()).toBe(HMSSimulcastLayer.NONE);
    expect(stream.isAudioSubscribed()).toBe(true);
  });

  it('sends data channel message when layer is switched', () => {
    stream.setVideo(HMSSimulcastLayer.HIGH);
    expect(sendOverApiDataChannel.mock.calls.length).toBe(1);
    const args = JSON.parse(sendOverApiDataChannel.mock.calls[0][0]);
    expect(args['streamId']).toBe(streamId);
    expect(args['video']).toBe(HMSSimulcastLayer.HIGH);
    expect(args['audio']).toBe(true);
    expect(args['framerate']).toBe(HMSSimulcastLayer.HIGH);
  });

  it('does not send a message when layer stays same', () => {
    stream.setVideo(HMSSimulcastLayer.NONE);
    expect(sendOverApiDataChannel.mock.calls.length).toBe(0);
  });

  it('sends message when audio is disabled', () => {
    stream.setAudio(true);
    expect(sendOverApiDataChannel.mock.calls.length).toBe(0);
    stream.setAudio(false);
    const args = JSON.parse(sendOverApiDataChannel.mock.calls[0][0]);
    expect(args['streamId']).toBe(streamId);
    expect(args['audio']).toBe(false);
  });
});
