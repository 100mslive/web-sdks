import HMSSubscribeConnection from '../../connection/subscribe';
import HMSMediaStream from './HMSMediaStream';
import { HMSSimulcastLayer } from '../settings';
import { HMSRemoteVideoTrack, HMSRemoteAudioTrack } from '../tracks';
import HMSLogger from '../../utils/logger';

export type HMSRemoteTrack = HMSRemoteAudioTrack | HMSRemoteVideoTrack;

/** @internal */
export default class HMSRemoteStream extends HMSMediaStream {
  private readonly connection: HMSSubscribeConnection;
  private audio = true;
  private video = HMSSimulcastLayer.MEDIUM;
  private frameRate = HMSSimulcastLayer.HIGH;

  constructor(nativeStream: MediaStream, connection: HMSSubscribeConnection) {
    super(nativeStream);
    this.connection = connection;
  }

  setAudio(enabled: boolean) {
    if (this.audio === enabled) return;

    this.audio = enabled;
    this.syncWithApiChannel();
  }

  setVideo(layer: HMSSimulcastLayer) {
    if (this.video === layer) return;

    this.video = layer;
    HMSLogger.v('[Remote stream]', `Switching to ${layer} layer`);
    this.syncWithApiChannel();
  }

  getSimulcastLayer() {
    return this.video;
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
