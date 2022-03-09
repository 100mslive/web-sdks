import HMSSubscribeConnection from '../../connection/subscribe';
import HMSMediaStream from './HMSMediaStream';
import HMSLogger from '../../utils/logger';
import { HMSSimulcastLayer } from '../../interfaces';

/** @internal */
export default class HMSRemoteStream extends HMSMediaStream {
  private readonly connection: HMSSubscribeConnection;
  private audio = true;
  private video = HMSSimulcastLayer.NONE;
  private frameRate = HMSSimulcastLayer.HIGH;

  constructor(nativeStream: MediaStream, connection: HMSSubscribeConnection) {
    super(nativeStream);
    this.connection = connection;
  }

  setAudio(enabled: boolean) {
    if (this.audio === enabled) {
      return;
    }

    this.audio = enabled;
    this.syncWithApiChannel();
  }

  /**
   * Sets the video layer after receiving new state from SFU. This is used when server side subscribe
   * degradation is ON.
   * @param layer is simulcast layer to be set
   */
  setVideoLayer(layer: HMSSimulcastLayer) {
    this.video = layer;
    HMSLogger.d(`[Remote stream] ${this.id}`, `Switching to ${layer} layer`);
  }

  /**
   * Sets the video layer and updates the track state to SFU via api datachannel. This is used when client
   * side subscribe degradation is ON or client unsubscribes the current track.
   * @param layer is simulcast layer to be set
   */
  setVideo(layer: HMSSimulcastLayer) {
    if (this.video === layer) {
      HMSLogger.d(`[Remote stream] ${this.id}`, `Already on ${layer} layer`);
      return;
    }

    this.setVideoLayer(layer);
    this.syncWithApiChannel();
  }

  getSimulcastLayer() {
    return this.video;
  }

  isAudioSubscribed() {
    return this.audio;
  }

  isServerHandlingDegradation() {
    return this.connection.isServerHandlingDegradation;
  }

  private syncWithApiChannel() {
    const data = {
      streamId: this.id,
      video: this.video,
      audio: this.audio,
      framerate: this.frameRate,
    };
    this.connection.sendOverApiDataChannel(JSON.stringify(data));
  }
}
