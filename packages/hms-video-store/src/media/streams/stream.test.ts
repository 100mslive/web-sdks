import { HMSRemoteStream } from './HMSRemoteStream';
import { PreferAudioLayerParams, PreferVideoLayerParams } from '../../connection/channel-messages';
import HMSSubscribeConnection from '../../connection/subscribe/subscribeConnection';
import { HMSSimulcastLayer } from '../../interfaces';

const streamId = '123';
const videoTrackId = '456';
const audioTrackId = '789';
const nativeStream = { id: streamId } as MediaStream;

describe('HMSRemoteStream', () => {
  let stream: HMSRemoteStream;
  let sendOverApiDataChannelWithResponse: jest.Mock;
  beforeEach(() => {
    sendOverApiDataChannelWithResponse = jest.fn();
    const connection = { sendOverApiDataChannelWithResponse } as unknown as HMSSubscribeConnection;
    stream = new HMSRemoteStream(nativeStream, connection);
  });

  const expectVideoSubscriptionMessage = (params: PreferVideoLayerParams['params']) => {
    const calls = sendOverApiDataChannelWithResponse.mock.calls;
    const args = calls[calls.length - 1][0];
    expect(args.params.track_id).toBe(params.track_id);
    expect(args.params.max_spatial_layer).toBe(params.max_spatial_layer);
  };

  const expectAudioSubscriptionMessage = (params: PreferAudioLayerParams['params']) => {
    const calls = sendOverApiDataChannelWithResponse.mock.calls;
    const args = calls[calls.length - 1][0];
    expect(args.params.track_id).toBe(params.track_id);
    expect(args.params.subscribed).toBe(params.subscribed);
  };

  // no video is subscribed by default
  it('returns none by default for video, true for audio', () => {
    expect(stream.getVideoLayer()).toBe(HMSSimulcastLayer.NONE);
    expect(stream.isAudioSubscribed()).toBe(true);
  });

  it('sends data channel message when layer is switched', () => {
    stream.setVideoLayer(HMSSimulcastLayer.HIGH, videoTrackId, 'test', 'testSource');
    expect(sendOverApiDataChannelWithResponse.mock.calls.length).toBe(1);
    expectVideoSubscriptionMessage({
      track_id: videoTrackId,
      max_spatial_layer: HMSSimulcastLayer.HIGH,
    });
  });

  it('sends message when audio is disabled', () => {
    stream.setAudio(true, audioTrackId);
    expect(sendOverApiDataChannelWithResponse.mock.calls.length).toBe(0);
    stream.setAudio(false, audioTrackId);
    expect(sendOverApiDataChannelWithResponse.mock.calls.length).toBe(1);
    expectAudioSubscriptionMessage({
      track_id: audioTrackId,
      subscribed: false,
    });
  });

  it('send audio or video based on what changed', () => {
    stream.setAudio(false, audioTrackId);
    expectAudioSubscriptionMessage({
      track_id: audioTrackId,
      subscribed: false,
    });
    stream.setVideoLayer(HMSSimulcastLayer.HIGH, videoTrackId, 'test', 'test source');
    expectVideoSubscriptionMessage({
      track_id: videoTrackId,
      max_spatial_layer: HMSSimulcastLayer.HIGH,
    });
    stream.setAudio(true, audioTrackId);
    expectAudioSubscriptionMessage({
      track_id: audioTrackId,
      subscribed: true,
    });
    stream.setVideoLayer(HMSSimulcastLayer.MEDIUM, videoTrackId, 'test', 'testSource');
    expectVideoSubscriptionMessage({
      track_id: videoTrackId,
      max_spatial_layer: HMSSimulcastLayer.MEDIUM,
    });
  });
});
