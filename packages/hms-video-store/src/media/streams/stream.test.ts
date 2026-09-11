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
    sendOverApiDataChannelWithResponse = jest.fn().mockResolvedValue({});
    // isClosed stops the re-drive a rejecting send would otherwise park; these tests are about the
    // rejection reaching the caller, not about convergence
    const connection = {
      sendOverApiDataChannelWithResponse,
      isClosed: () => true,
    } as unknown as HMSSubscribeConnection;
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

  /**
   * Repeat requests dedupe against the desired value, which is set before the request goes out. A
   * request the SFU never applied must not swallow the next attempt to reach that same state -
   * the shape behind the Sep 2026 white recordings.
   */
  describe('when the request fails', () => {
    const rejects = () => sendOverApiDataChannelWithResponse.mockRejectedValue(Error('No response from SFU'));

    it('reports the video layer as unsettled', async () => {
      rejects();
      await expect(stream.setVideoLayer(HMSSimulcastLayer.HIGH, videoTrackId, 'test', 'src')).rejects.toThrow();
      expect(stream.isVideoLayerSettled(HMSSimulcastLayer.HIGH)).toBe(false);
    });

    it('sends the same audio state again instead of deduping against it', async () => {
      rejects();
      await expect(stream.setAudio(false, audioTrackId)).rejects.toThrow();

      sendOverApiDataChannelWithResponse.mockResolvedValue({});
      await stream.setAudio(false, audioTrackId);

      expect(sendOverApiDataChannelWithResponse).toHaveBeenCalledTimes(2);
      expect(stream.isAudioSubscribed()).toBe(false);
    });

    it('dedupes again once the SFU confirms', async () => {
      rejects();
      await expect(stream.setAudio(false, audioTrackId)).rejects.toThrow();

      sendOverApiDataChannelWithResponse.mockResolvedValue({});
      await stream.setAudio(false, audioTrackId);
      await stream.setAudio(false, audioTrackId);

      expect(sendOverApiDataChannelWithResponse).toHaveBeenCalledTimes(2);
    });

    /** a newer request owns the state, so an older one settling must not confirm its layer */
    it('does not confirm a layer a newer request replaced', async () => {
      let failFirst!: (error: Error) => void;
      sendOverApiDataChannelWithResponse
        .mockImplementationOnce(() => new Promise((_resolve, reject) => (failFirst = reject)))
        .mockImplementationOnce(() => new Promise(() => undefined));

      const first = stream.setVideoLayer(HMSSimulcastLayer.HIGH, videoTrackId, 'test', 'first').catch(error => error);
      stream.setVideoLayer(HMSSimulcastLayer.MEDIUM, videoTrackId, 'test', 'second').catch(() => undefined);
      failFirst(Error('No response from SFU'));
      await first;

      expect(stream.getVideoLayer()).toBe(HMSSimulcastLayer.MEDIUM);
      expect(stream.isVideoLayerSettled(HMSSimulcastLayer.HIGH)).toBe(false);
    });

    /**
     * A superseded request resolves locally without the SFU ever seeing it. Reading that as an
     * acknowledgement re-creates the swallowed-retry bug for the very case most likely to hit it:
     * two requests for the same value, neither answered.
     */
    it('does not treat a superseded resolution as an acknowledgement', async () => {
      sendOverApiDataChannelWithResponse.mockResolvedValue({ id: 'req', dropped: true });

      await stream.setAudio(false, audioTrackId);
      expect(stream.isAudioSubscribed()).toBe(false);

      sendOverApiDataChannelWithResponse.mockClear();
      await stream.setAudio(false, audioTrackId);

      expect(sendOverApiDataChannelWithResponse).toHaveBeenCalledTimes(1);
    });
  });

  /** repeated triggers while a request is in flight must not fan out duplicates of it */
  it('dedupes a repeat request for a layer already on the wire', async () => {
    sendOverApiDataChannelWithResponse.mockImplementation(() => new Promise(() => undefined));

    stream.setVideoLayer(HMSSimulcastLayer.HIGH, videoTrackId, 'test', 'resize').catch(() => undefined);

    expect(stream.isVideoLayerSettled(HMSSimulcastLayer.HIGH)).toBe(true);
    expect(stream.isVideoLayerSettled(HMSSimulcastLayer.LOW)).toBe(false);
  });

  /** a layer the SFU reports is already applied - no request needed to reach it */
  it('treats a server-sent layer as settled', () => {
    stream.setVideoLayerFromServer(HMSSimulcastLayer.LOW, 'test', 'setLayerFromServer');

    expect(stream.isVideoLayerSettled(HMSSimulcastLayer.LOW)).toBe(true);
  });
});
