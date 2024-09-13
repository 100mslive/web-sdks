import { HMSRemoteVideoTrack } from './HMSRemoteVideoTrack';
import HMSSubscribeConnection from '../../connection/subscribe/subscribeConnection';
import { HMSSimulcastLayer } from '../../interfaces';
import { HMSRemoteStream } from '../streams/HMSRemoteStream';

const streamId = '123';
const trackId = '456';
const nativeStream = { id: streamId } as MediaStream;
let videoElement!: HTMLVideoElement;

describe('remoteVideoTrack', () => {
  let stream: HMSRemoteStream;
  let sendOverApiDataChannelWithResponse: jest.Mock;
  let track: HMSRemoteVideoTrack;
  let nativeTrack: MediaStreamTrack;
  beforeEach(() => {
    videoElement = document.createElement('video');
    sendOverApiDataChannelWithResponse = jest.fn();
    const connection = { sendOverApiDataChannelWithResponse } as unknown as HMSSubscribeConnection;
    stream = new HMSRemoteStream(nativeStream, connection);
    nativeTrack = { id: trackId, kind: 'video', enabled: true } as MediaStreamTrack;
    track = new HMSRemoteVideoTrack(stream, nativeTrack, 'regular', false);
    window.MediaStream = jest.fn().mockImplementation(() => ({
      addTrack: jest.fn(),
      // Add any method you want to mock
    }));
  });

  const expectDegradationLayerAndSink = (isDegraded: boolean, layer: HMSSimulcastLayer, hasSink: boolean) => {
    expect(track.degraded).toBe(isDegraded);
    expect(track.getLayer()).toBe(layer);
    expect(track.hasSinks()).toBe(hasSink);
  };

  // visible means track is on page in view and even if it's degraded, its
  // degradation status is visible
  const expectDegradedVisible = () => {
    expectDegradationLayerAndSink(true, HMSSimulcastLayer.NONE, true);
  };
  const expectNonDegradedVisible = (layer = HMSSimulcastLayer.HIGH) => {
    expectDegradationLayerAndSink(false, layer, true);
  };
  const expectNonDegradedNotVisible = () => {
    expectDegradationLayerAndSink(false, HMSSimulcastLayer.NONE, false);
  };

  /**
   * expectation on layers sent over data channel since start of the test
   */
  const expectLayersSent = (layers: HMSSimulcastLayer[]) => {
    const allCalls = sendOverApiDataChannelWithResponse.mock.calls;
    expect(allCalls.length).toBe(layers.length);
    for (let i = 0; i < allCalls.length; i++) {
      const data = allCalls[i][0];
      expect(data.params.max_spatial_layer).toBe(layers[i]);
    }
  };

  const sfuDegrades = () => {
    track.setLayerFromServer({
      subscriber_degraded: true,
      expected_layer: HMSSimulcastLayer.HIGH,
      current_layer: HMSSimulcastLayer.NONE,
      publisher_degraded: false,
      track_id: trackId,
    });
  };

  const sfuRecovers = () => {
    track.setLayerFromServer({
      subscriber_degraded: false,
      expected_layer: HMSSimulcastLayer.HIGH,
      current_layer: HMSSimulcastLayer.HIGH,
      publisher_degraded: false,
      track_id: trackId,
    });
  };

  test('defaults are good', () => {
    expect(track.trackId).toBe(trackId);
    expectNonDegradedNotVisible();
  });

  test('single addsink and remove sink', async () => {
    await track.addSink(videoElement);
    expectNonDegradedVisible();
    await track.removeSink(videoElement);
    expectNonDegradedNotVisible();
    expectLayersSent([HMSSimulcastLayer.HIGH, HMSSimulcastLayer.NONE]);
  });

  test('multiple addsink and removesink', async () => {
    const videoElement2 = document.createElement('video');
    await track.addSink(videoElement);
    await track.addSink(videoElement2);
    expectLayersSent([HMSSimulcastLayer.HIGH]);
    expectNonDegradedVisible();
    await track.removeSink(videoElement);
    expectLayersSent([HMSSimulcastLayer.HIGH]);
    expectNonDegradedVisible();
    await track.removeSink(videoElement2);
    expectNonDegradedNotVisible();
    expectLayersSent([HMSSimulcastLayer.HIGH, HMSSimulcastLayer.NONE]);
  });

  test('prefer layer', async () => {
    expectNonDegradedNotVisible();
    await track.setPreferredLayer(HMSSimulcastLayer.LOW);
    expectDegradationLayerAndSink(false, HMSSimulcastLayer.NONE, false);
    await track.addSink(videoElement);
    expectNonDegradedVisible(HMSSimulcastLayer.LOW);
    await track.setPreferredLayer(HMSSimulcastLayer.MEDIUM);
    expectDegradationLayerAndSink(false, HMSSimulcastLayer.MEDIUM, true);
    expectLayersSent([HMSSimulcastLayer.LOW, HMSSimulcastLayer.MEDIUM]);
  });

  /**
   * say track is degraded on first page, if user moves to second page
   * and remove sink is called for the track on the first page, the
   * corresponding message must be sent to the SFU.
   */
  test('sfu degradation with pagination', async () => {
    await track.addSink(videoElement);
    expectNonDegradedVisible();
    expectLayersSent([HMSSimulcastLayer.HIGH]);

    sfuDegrades();
    expectDegradedVisible();
    sfuRecovers();
    expectNonDegradedVisible();
    sfuDegrades();
    expectLayersSent([HMSSimulcastLayer.HIGH]);

    await track.removeSink(videoElement);
    expectNonDegradedNotVisible();
    expectLayersSent([HMSSimulcastLayer.HIGH, HMSSimulcastLayer.NONE]);
  });

  /**
   * say a track is degraded post which it is muted. degraded should become
   * false and removesink message should be sent to the SFU.
   */
  test('sfu degradation + track mute', async () => {
    expect(track.enabled).toBe(true);
    await track.addSink(videoElement);
    expectNonDegradedVisible();
    expectLayersSent([HMSSimulcastLayer.HIGH]);
    sfuDegrades();
    expectDegradedVisible();
    track.setEnabled(false);
    expectDegradationLayerAndSink(true, HMSSimulcastLayer.NONE, true);
    expectLayersSent([HMSSimulcastLayer.HIGH]);
    // video goes out of view or UI detaches
    await track.removeSink(videoElement);
    expectNonDegradedNotVisible();
    expectLayersSent([HMSSimulcastLayer.HIGH, HMSSimulcastLayer.NONE]);
  });
});

describe('HMSRemoteVideoTrack with disableNoneLayerRequest', () => {
  let stream: HMSRemoteStream;
  let sendOverApiDataChannelWithResponse: jest.Mock;
  let track: HMSRemoteVideoTrack;
  let nativeTrack: MediaStreamTrack;
  let videoElement: HTMLVideoElement;
  const trackId = 'test-track-id';

  beforeEach(() => {
    videoElement = document.createElement('video');
    sendOverApiDataChannelWithResponse = jest.fn();
    const connection = { sendOverApiDataChannelWithResponse } as unknown as HMSSubscribeConnection;
    const nativeStream = new MediaStream();
    stream = new HMSRemoteStream(nativeStream, connection);
    nativeTrack = { id: trackId, kind: 'video', enabled: true } as MediaStreamTrack;
    track = new HMSRemoteVideoTrack(stream, nativeTrack, 'regular', true); // disableNoneLayerRequest flag is set
    track.setTrackId(trackId);

    window.MediaStream = jest.fn().mockImplementation(() => ({
      addTrack: jest.fn(),
    }));
  });

  const expectLayersSent = (layers: HMSSimulcastLayer[]) => {
    const allCalls = sendOverApiDataChannelWithResponse.mock.calls;
    expect(allCalls.length).toBe(layers.length);
    for (let i = 0; i < allCalls.length; i++) {
      const data = allCalls[i][0];
      expect(data.params.max_spatial_layer).toBe(layers[i]);
    }
  };

  const sfuDegrades = () => {
    track.setLayerFromServer({
      subscriber_degraded: true,
      expected_layer: HMSSimulcastLayer.HIGH,
      current_layer: HMSSimulcastLayer.NONE,
      publisher_degraded: false,
      track_id: trackId,
    });
  };

  test('disableNoneLayerRequest - degradation', async () => {
    await track.addSink(videoElement);
    expectLayersSent([HMSSimulcastLayer.HIGH]);

    sfuDegrades();
    expectLayersSent([HMSSimulcastLayer.HIGH]);
  });

  test('disableNoneLayerRequest - mute and removeSink', async () => {
    await track.addSink(videoElement);
    track.setEnabled(false);
    expectLayersSent([HMSSimulcastLayer.HIGH]);

    await track.removeSink(videoElement);
    expectLayersSent([HMSSimulcastLayer.HIGH]);
  });
});
