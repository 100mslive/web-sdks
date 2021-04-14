import HMSAudioTrackSettings from "../media/settings/HMSAudioTrackSettings";
import HMSVideoTrackSettings from "../media/settings/HMSVideoTrackSettings";

export async function getAudioTrack(settings: HMSAudioTrackSettings) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: settings.toConstraints()
  });
  return stream.getAudioTracks()[0];
}

export async function getVideoTrack(settings: HMSVideoTrackSettings) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: settings.toConstraints()
  });
  return stream.getVideoTracks()[0];
}
