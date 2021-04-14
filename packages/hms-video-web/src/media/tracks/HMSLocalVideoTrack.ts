import HMSVideoTrack from "./HMSVideoTrack";
import HMSLocalStream from "../streams/HMSLocalStream";

export default class HMSLocalVideoTrack extends HMSVideoTrack {

  constructor(stream: HMSLocalStream, track: MediaStreamTrack) {
    super(stream, track);
  }

  async setEnabled(value: boolean): Promise<void> {
    await super.setEnabled(value);
    if (value) {
      // TODO: Get a new track, replace it with the current nativeTrack
      // TODO: Blocked because of `settings`
    } else {
      this.nativeTrack.stop();
    }
  }
}
