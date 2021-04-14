import HMSMediaStream from "./HMSMediaStream";
import HMSConnection from "../../connection";
import HMSTrack from "../tracks/HMSTrack";

export default class HMSLocalStream extends HMSMediaStream {
  constructor(nativeStream: MediaStream) {
    super(nativeStream);
  }

  addTransceiver(connection: HMSConnection, track: HMSTrack) {
    // TODO: Add support for simulcast
    const transceiver = connection.addTransceiver(track.nativeTrack, {
      streams: [this.nativeStream],
      direction: "sendonly",
      sendEncodings: undefined // TODO
    });
    this.setPreferredCodec(transceiver, track.nativeTrack.kind);
    return transceiver;
  }

  setPreferredCodec(transceiver: RTCRtpTransceiver, kind: string) {
    // TODO: Some browsers don't support setCodecPreferences, resort to SDPMunging?
  }

  removeSender(connection: HMSConnection, track: HMSTrack) {
    connection.getSenders().forEach(sender => {
      if (sender.track == track.nativeTrack) {
        connection.removeTrack(sender);

        // Remove the local reference as well
        const toRemoveLocalTrackIdx = this.tracks.indexOf(track);
        if (toRemoveLocalTrackIdx !== -1) {
          this.tracks.splice(toRemoveLocalTrackIdx, 1);
        } else throw Error(`Cannot find ${track} in locally stored tracks`);
      }
    });
  }
}