import * as sdpTransform from 'sdp-transform';
import { isPresent } from './validations';
import { TrackState } from '../notification-manager';

/**
 * @DISCUSS: Should we have a wrapper over RTCSessionDescriptionInit(SDP) and have these methods in it?
 */

export function fixMsid(desc: RTCSessionDescriptionInit, tracks?: Map<string, TrackState>): RTCSessionDescriptionInit {
  const parsedSdp = sdpTransform.parse(desc.sdp!);

  if (!parsedSdp.origin?.username.startsWith('mozilla')) {
    // This isn't firefox, so we return the original offer without doing anything
    return desc;
  }

  const mediaTracks = tracks ? Array.from(tracks.values()) : [];

  parsedSdp.media.forEach(m => {
    const streamId = m.msid?.split(' ')[0];
    // check for both type and streamid as both video and screenshare have same type but different stream_id
    const trackId = mediaTracks.find(val => val.type === m.type && val.stream_id === streamId)?.track_id;
    if (trackId) {
      m.msid = m.msid?.replace(/\s(.+)/, ` ${trackId}`);
    }
  });

  return { type: desc.type, sdp: sdpTransform.write(parsedSdp) };
}

/**
 * Get the track ID from the SDP using the transceiver's mid from RTCTrackEvent
 * @TODO: This could take more processing time in a large room and when the SDP is big.
 * Consider using this for Firefox only?
 */
export function getSdpTrackIdForMid(
  desc?: RTCSessionDescriptionInit | null,
  mid?: RTCRtpTransceiver['mid'],
): string | undefined {
  if (!desc?.sdp || !mid) {
    return undefined;
  }
  const parsedSdp = sdpTransform.parse(desc.sdp);
  const trackSection = parsedSdp.media.find(media => isPresent(media.mid) && parseInt(media.mid!) === parseInt(mid));
  const trackId = trackSection?.msid?.split(' ')[1];
  return trackId;
}

export function enableOpusDtx(desc: RTCSessionDescriptionInit): RTCSessionDescriptionInit {
  if (desc.sdp!.includes('usedtx=1')) {
    return desc;
  }

  return { type: desc.type, sdp: desc.sdp!.replace('useinbandfec=1', 'useinbandfec=1;usedtx=1') };
}
