import HMSSubscribeConnection from "../../connection/subscribe";
import HMSMediaStream from "./HMSMediaStream";
import {HMSSimulcastLayer} from "../settings";

export default class HMSRemoteStream extends HMSMediaStream {
  private readonly connection: HMSSubscribeConnection;
  private audio = true;
  private video = HMSSimulcastLayer.HIGH;
  private frameRate = HMSSimulcastLayer.HIGH;

  constructor(nativeStream: MediaStream, connection: HMSSubscribeConnection) {
    super(nativeStream);
    this.connection = connection;
  }

  async setAudio(enabled: boolean) {
    this.audio = enabled;
    await this.syncWithApiChannel();
  }

  async setVideo(enabled: boolean) {
    this.video = (enabled ? HMSSimulcastLayer.HIGH : HMSSimulcastLayer.NONE);
    await this.syncWithApiChannel();
  }

  async syncWithApiChannel() {
    const data = {
      streamId: this.nativeStream.id,
      video: this.video,
      audio: this.audio,
      framerate: this.frameRate
    };
    await this.connection.apiChannel.send(JSON.stringify(data));
  }
}