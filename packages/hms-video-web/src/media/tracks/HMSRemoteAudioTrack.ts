import HMSAudioTrack from "./HMSAudioTrack";
import HMSRemoteStream from "../streams/HMSRemoteStream";

export default class HMSRemoteAudioTrack extends HMSAudioTrack {

  constructor(stream: HMSRemoteStream, track: MediaStreamTrack) {
    super(stream, track);
  }
}