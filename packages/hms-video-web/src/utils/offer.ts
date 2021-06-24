import * as sdpTransform from 'sdp-transform';
import { TrackState } from '../sdk/models/HMSNotifications';

export function transformOffer(
  offer: RTCSessionDescriptionInit,
  tracks: Map<string, TrackState>,
): RTCSessionDescriptionInit {
  const parsedSdp = sdpTransform.parse(offer.sdp!);
  if (!parsedSdp.origin?.username.startsWith('mozilla')) {
    // This isn't firefox, so we return the original offer without doing anything
    return offer;
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

  return { ...offer, sdp: sdpTransform.write(parsedSdp) };
}

export function enableOpusDtx(offer: RTCSessionDescriptionInit): RTCSessionDescriptionInit {
  if (offer.sdp!.includes('usedtx=1')) return offer;

  return { type: 'offer', sdp: offer.sdp!.replace('useinbandfec=1', 'useinbandfec=1;usedtx=1') };
}
