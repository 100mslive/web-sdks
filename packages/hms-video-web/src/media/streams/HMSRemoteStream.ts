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

  isServerHandlingDegradation() {
    return this.connection.isServerHandlingDegradation;
  }

  /**
   * send the expected state of the stream to SFU over data channel
   * @private
   */
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
