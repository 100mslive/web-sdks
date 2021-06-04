import {HMSPeer, HMSStore, HMSTrack} from "../schema";

export function isScreenSharing(store: HMSStore, peer: HMSPeer) {
    return (
        peer &&
        peer.auxiliaryTracks.some(trackID => {
            if (trackID && store.tracks[trackID]) {
                const track = store.tracks[trackID];
                return isScreenShare(track);
            }
            return false;
        })
    );
}

export function isScreenShare(track: HMSTrack | undefined) {
    return track && track.type === 'video' && track.source === 'screen';
}

export function isTrackEnabled(store: HMSStore, trackID?: string) {
    if (trackID && store.tracks[trackID]) {
        return store.tracks[trackID].enabled;
    }
    return false;
}

/**
 * Should UI show the video track as enabled
 */
export function isTrackDisplayEnabled(store: HMSStore, trackID?: string) {
    if (trackID && store.tracks[trackID]) {
        return store.tracks[trackID].displayEnabled;
    }
    return false;
}
