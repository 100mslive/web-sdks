import * as sdpTransform from 'sdp-transform';
import { TrackState } from '../sdk/models/HMSNotifications';

export function fixMsid(desc: RTCSessionDescriptionInit, tracks: Map<string, TrackState>): RTCSessionDescriptionInit {
  const parsedSdp = sdpTransform.parse(desc.sdp!);

  if (!parsedSdp.origin?.username.startsWith('mozilla')) {
    // This isn't firefox, so we return the original offer without doing anything
    return desc;
  }

  const mediaTracks = Array.from(tracks.values());

  parsedSdp.media.forEach((m) => {
    const streamId = m.msid?.split(' ')[0];
    // check for both type and streamid as both video and screenshare have same type but different stream_id
    const trackId = mediaTracks.find((val) => val.type === m.type && val.stream_id === streamId)?.track_id;
    if (trackId) {
      m.msid = m.msid?.replace(/\s(.+)/, ` ${trackId}`);
    }
  });

  return { type: desc.type, sdp: sdpTransform.write(parsedSdp) };
}

export function enableOpusDtx(desc: RTCSessionDescriptionInit): RTCSessionDescriptionInit {
  if (desc.sdp!.includes('usedtx=1')) return desc;

  return { type: desc.type, sdp: desc.sdp!.replace('useinbandfec=1', 'useinbandfec=1;usedtx=1') };
}
