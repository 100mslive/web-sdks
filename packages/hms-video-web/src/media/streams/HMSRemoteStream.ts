import HMSSubscribeConnection from '../../connection/subscribe';
import HMSMediaStream from './HMSMediaStream';
import { HMSSimulcastLayer } from '../settings';
import { HMSRemoteVideoTrack, HMSRemoteAudioTrack } from '../tracks';

export type HMSRemoteTrack = HMSRemoteAudioTrack | HMSRemoteVideoTrack;

/** @internal */
export default class HMSRemoteStream extends HMSMediaStream {
  private readonly connection: HMSSubscribeConnection;
  private audio = true;
  private video = HMSSimulcastLayer.HIGH;
  private frameRate = HMSSimulcastLayer.HIGH;

  constructor(nativeStream: MediaStream, connection: HMSSubscribeConnection) {
    super(nativeStream);
    this.connection = connection;
  }

  setAudio(enabled: boolean) {
    this.audio = enabled;
    this.syncWithApiChannel();
  }

  setVideo(layer: HMSSimulcastLayer) {
    this.video = layer;
    this.syncWithApiChannel();
  }

  syncWithApiChannel() {
    const data = {
      streamId: this.id,
      video: this.video,
      audio: this.audio,
      framerate: this.frameRate,
    };
    this.connection.sendOverApiDataChannel(JSON.stringify(data));
  }
}
