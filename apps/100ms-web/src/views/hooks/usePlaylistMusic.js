import {
  selectAudioPlaylist,
  selectAudioPlaylistTrackByPeerID,
  selectPeerSharingAudioPlaylist,
  useHMSStore,
} from "@100mslive/react-sdk";

export const usePlaylistMusic = () => {
  const peer = useHMSStore(selectPeerSharingAudioPlaylist);
  const track = useHMSStore(selectAudioPlaylistTrackByPeerID(peer?.id));
  const selection = useHMSStore(selectAudioPlaylist.selectedItem);

  if (!peer || !track) {
    return null;
  }
  // Don't show mute option if remote peer has disabled
  if (!peer.isLocal && !track.enabled) {
    return null;
  }

  if (peer.isLocal && !selection) {
    return null;
  }
  return { selection, peer, track };
};
