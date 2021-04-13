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
    if ('setCodecPreferences' in transceiver) {
      const cap = RTCRtpSender.getCapabilities(kind);
      if (!cap)
        return;
      const selCodec = cap.codecs.find((c) => c.mimeType.toLowerCase() === `video/${this.constraints.codec.toLowerCase()}` ||
          c.mimeType.toLowerCase() === `audio/opus`);
      if (selCodec) {
        transceiver.setCodecPreferences([selCodec]);
      }
    } // TODO: Some browsers don't support this, resort to SDPMunging?
  }
}