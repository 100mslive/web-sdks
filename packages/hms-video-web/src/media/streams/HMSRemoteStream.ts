import HMSSubscribeConnection from '../../connection/subscribe';
import HMSMediaStream from './HMSMediaStream';
import HMSLogger from '../../utils/logger';
import { HMSSimulcastLayer } from '../../interfaces';

/** @internal */
export default class HMSRemoteStream extends HMSMediaStream {
  private readonly connection: HMSSubscribeConnection;
  private audio = true;
  private video = HMSSimulcastLayer.NONE;

  constructor(nativeStream: MediaStream, connection: HMSSubscribeConnection) {
    super(nativeStream);
    this.connection = connection;
  }

  setAudio(enabled: boolean) {
    if (this.audio === enabled) {
      return;
    }

    this.audio = enabled;
    this.syncWithApiChannel(false);
  }

  /**
   * Sets the video layer after receiving new state from SFU. This is used when server side subscribe
   * degradation is ON.
   * @param layer is simulcast layer to be set
   * @param identifier is stream identifier to be printed in logs
   */
  setVideoLayerLocally(layer: HMSSimulcastLayer, identifier: string) {
    this.video = layer;
    HMSLogger.d(`[Remote stream] ${identifier} - ${this.id}`, `Setting layer field to - ${layer}`);
  }

  /**
   * Sets the video layer and updates the track state to SFU via api datachannel. This is used when client
   * side subscribe degradation is ON or client unsubscribes the current track.
   * @param layer is simulcast layer to be set
   * @param identifier is stream identifier to be printed in logs
   */
  setVideoLayer(layer: HMSSimulcastLayer, identifier: string) {
    this.setVideoLayerLocally(layer, identifier);
    HMSLogger.d(`[Remote stream] ${identifier} - ${this.id}`, `Switching to ${layer} layer`);
    this.syncWithApiChannel();
  }

  getSimulcastLayer() {
    return this.video;
  }

  isAudioSubscribed() {
    return this.audio;
  }

  /**
   * send the expected state of the stream to SFU over data channel.
   * the video field is optional from SFU's perspective but audio should be
   * passed everytime.
   * We don't pass in the video field, if only audio needs to subscribed/unsubscribed,
   * else there is a chance of mismatch between states in case of degradation. If
   * a degraded track is (audio) muted, a video layer false will be sent which to
   * SFU will appear as if remove sink was called and the track will never be recovered.
   * @private
   */
  private syncWithApiChannel(sendVideoLayer = true) {
    if (sendVideoLayer) {
      const data: PreferVideoLayerParams = {
        params: {
          max_spatial_layer: this.video,
          track_id: this.nativeStream.getVideoTracks()[0].id,
        },
        id: 'prefer-video-track-state',
        method: 'prefer-video-track-state',
        jsonrpc: '2.0',
      };
      this.connection.sendOverApiDataChannel(JSON.stringify(data));
    } else {
      const data: PreferAudioLayerParams = {
        params: {
          subscribed: this.audio,
          track_id: this.nativeStream.getAudioTracks()[0].id,
        },
        method: 'prefer-audio-track-state',
        id: 'prefer-audio-track-state',
        jsonrpc: '2.0',
      };
      this.connection.sendOverApiDataChannel(JSON.stringify(data));
    }
  }
}

interface PreferVideoLayerParams {
  params: {
    max_spatial_layer: HMSSimulcastLayer;
    track_id: string;
  };
  method: 'prefer-video-track-state';
  id: 'prefer-video-track-state';
  jsonrpc: '2.0';
}

interface PreferAudioLayerParams {
  params: {
    subscribed: boolean;
    track_id: string;
  };
  id: 'prefer-audio-track-state';
  method: 'prefer-audio-track-state';
  jsonrpc: '2.0';
}
