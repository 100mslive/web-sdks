import HMSAudioTrack from "./HMSAudioTrack";
import HMSLocalStream from "../streams/HMSLocalStream";

export default class HMSLocalAudioTrack extends HMSAudioTrack {

  constructor(stream: HMSLocalStream, track: MediaStreamTrack) {
    super(stream, track);
  }

  async setEnabled(value: boolean) {
    await super.setEnabled(value);
    if (value) {
      // TODO: Get a new track, replace it with the current nativeTrack
      // TODO: Blocked because of `settings`
    } else {
      this.nativeTrack.stop();
    }
  }
}