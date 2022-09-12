import HMSRemoteStream from '../streams/HMSRemoteStream';
import { HMSRemoteVideoTrack } from './HMSRemoteVideoTrack';
import HMSSubscribeConnection from '../../connection/subscribe/subscribeConnection';
import { HMSSimulcastLayer } from '../../interfaces';

const streamId = '123';
const trackId = '456';
const nativeStream = { id: streamId } as MediaStream;
const videoElement = { srcObject: null } as HTMLVideoElement;

describe('remoteVideoTrack', () => {
  let stream: HMSRemoteStream;
  let sendOverApiDataChannelWithResponse: jest.Mock;
  let track: HMSRemoteVideoTrack;
  let nativeTrack: MediaStreamTrack;
  beforeEach(() => {
    sendOverApiDataChannelWithResponse = jest.fn();
    const connection = { sendOverApiDataChannelWithResponse } as unknown as HMSSubscribeConnection;
    stream = new HMSRemoteStream(nativeStream, connection);
    nativeTrack = { id: trackId, kind: 'video', enabled: true } as MediaStreamTrack;
    track = new HMSRemoteVideoTrack(stream, nativeTrack, 'regular');
    window.MediaStream = jest.fn().mockImplementation(() => ({
      addTrack: jest.fn(),
      // Add any method you want to mock
    }));
  });

  const expectDegradationLayerAndSink = (isDegraded: boolean, layer: HMSSimulcastLayer, hasSink: boolean) => {
    expect(track.degraded).toBe(isDegraded);
    expect(track.getSimulcastLayer()).toBe(layer);
    expect(track.hasSinks()).toBe(hasSink);
  };

  // visible means track is on page in view and even if it's degraded, its
  // degradation status is visible
  const expectDegradedVisible = () => {
    expectDegradationLayerAndSink(true, HMSSimulcastLayer.NONE, true);
  };
  const expectNonDegradedVisible = () => {
    expectDegradationLayerAndSink(false, HMSSimulcastLayer.HIGH, true);
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
    track.setLayerFromServer(HMSSimulcastLayer.NONE, true);
  };

  const sfuRecovers = () => {
    track.setLayerFromServer(HMSSimulcastLayer.HIGH, false);
  };

  test('defaults are good', () => {
    expect(track.trackId).toBe(trackId);
    expectNonDegradedNotVisible();
  });

  test('single addsink and remove sink', () => {
    track.addSink(videoElement);
    expectNonDegradedVisible();
    track.removeSink(videoElement);
    expectNonDegradedNotVisible();
    expectLayersSent([HMSSimulcastLayer.HIGH, HMSSimulcastLayer.NONE]);
  });

  test('multiple addsink and removesink', () => {
    const videoElement2 = { srcObject: null } as HTMLVideoElement;
    track.addSink(videoElement);
    track.addSink(videoElement2);
    expectLayersSent([HMSSimulcastLayer.HIGH]);
    expectNonDegradedVisible();
    track.removeSink(videoElement);
    expectLayersSent([HMSSimulcastLayer.HIGH]);
    expectNonDegradedVisible();
    track.removeSink(videoElement2);
    expectNonDegradedNotVisible();
    expectLayersSent([HMSSimulcastLayer.HIGH, HMSSimulcastLayer.NONE]);
  });

  test('prefer layer', () => {
    expectNonDegradedNotVisible();
    track.preferLayer(HMSSimulcastLayer.LOW);
    expectDegradationLayerAndSink(false, HMSSimulcastLayer.LOW, false);
    track.addSink(videoElement);
    expectNonDegradedVisible();
    track.preferLayer(HMSSimulcastLayer.MEDIUM);
    expectDegradationLayerAndSink(false, HMSSimulcastLayer.MEDIUM, true);
    expectLayersSent([HMSSimulcastLayer.LOW, HMSSimulcastLayer.HIGH, HMSSimulcastLayer.MEDIUM]);
  });

  test('sdk degradation', () => {
    track.addSink(videoElement);
    expectNonDegradedVisible();
    track.setDegradedFromSdk(true);
    expectDegradedVisible();
    track.setDegradedFromSdk(false); // recover
    expectDegradationLayerAndSink(false, HMSSimulcastLayer.HIGH, true);
    track.setDegradedFromSdk(true);

    track.removeSink(videoElement);
    expectDegradationLayerAndSink(false, HMSSimulcastLayer.NONE, false);
    expectLayersSent([
      HMSSimulcastLayer.HIGH,
      HMSSimulcastLayer.NONE,
      HMSSimulcastLayer.HIGH,
      HMSSimulcastLayer.NONE,
      HMSSimulcastLayer.NONE,
    ]);
  });

  test('sdk degradation + track mute', () => {
    expect(track.enabled).toBe(true);
    track.addSink(videoElement);
    expectNonDegradedVisible();
    track.setDegradedFromSdk(true);
    expectDegradedVisible();
    track.setEnabled(false);
    expectDegradationLayerAndSink(true, HMSSimulcastLayer.NONE, true);
    // video goes out of view
    track.removeSink(videoElement);
    expectNonDegradedNotVisible();
    expectLayersSent([HMSSimulcastLayer.HIGH, HMSSimulcastLayer.NONE, HMSSimulcastLayer.NONE]);
  });

  /**
   * say track is degraded on first page, if user moves to second page
   * and remove sink is called for the track on the first page, the
   * corresponding message must be sent to the SFU.
   */
  test('sfu degradation with pagination', () => {
    track.addSink(videoElement);
    expectNonDegradedVisible();
    expectLayersSent([HMSSimulcastLayer.HIGH]);

    sfuDegrades();
    expectDegradedVisible();
    sfuRecovers();
    expectNonDegradedVisible();
    sfuDegrades();
    expectLayersSent([HMSSimulcastLayer.HIGH]);

    track.removeSink(videoElement);
    expectNonDegradedNotVisible();
    expectLayersSent([HMSSimulcastLayer.HIGH, HMSSimulcastLayer.NONE]);
  });

  /**
   * say a track is degraded post which it is muted. degraded should become
   * false and removesink message should be sent to the SFU.
   */
  test('sfu degradation + track mute', () => {
    expect(track.enabled).toBe(true);
    track.addSink(videoElement);
    expectNonDegradedVisible();
    expectLayersSent([HMSSimulcastLayer.HIGH]);
    sfuDegrades();
    expectDegradedVisible();
    track.setEnabled(false);
    expectDegradationLayerAndSink(true, HMSSimulcastLayer.NONE, true);
    expectLayersSent([HMSSimulcastLayer.HIGH]);
    // video goes out of view or UI detaches
    track.removeSink(videoElement);
    expectNonDegradedNotVisible();
    expectLayersSent([HMSSimulcastLayer.HIGH, HMSSimulcastLayer.NONE]);
  });
});
