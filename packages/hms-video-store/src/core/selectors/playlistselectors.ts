import { createSelector } from 'reselect';
import { HMSPlaylistSelector, HMSPlaylistType, HMSStore } from '../schema';

/**
 * @internal
 */
const selectPlaylistMap =
  (type: HMSPlaylistType = HMSPlaylistType.audio) =>
  (store: HMSStore) =>
    store.playlist[type].list;

const selectPlaylistSelection =
  (type: HMSPlaylistType = HMSPlaylistType.audio) =>
  (store: HMSStore) =>
    store.playlist[type].selection;

const selectPlaylistProgress =
  (type: HMSPlaylistType = HMSPlaylistType.audio) =>
  (store: HMSStore) =>
    store.playlist[type].progress;

const selectPlaylistCurrentTime =
  (type: HMSPlaylistType = HMSPlaylistType.audio) =>
  (store: HMSStore) =>
    store.playlist[type].currentTime;

const selectPlaylistPlaybackRate =
  (type: HMSPlaylistType = HMSPlaylistType.audio) =>
  (store: HMSStore) =>
    store.playlist[type].playbackRate;

const selectPlaylistVolume =
  (type: HMSPlaylistType = HMSPlaylistType.audio) =>
  (store: HMSStore) =>
    store.playlist[type].volume;

/**
 * Select an array of playlist items.
 */
const selectPlaylist = (type: HMSPlaylistType = HMSPlaylistType.audio) =>
  createSelector(selectPlaylistMap(type), storePlaylist => {
    return Object.values(storePlaylist);
  });

const selectPlaylistSelectedItem = (type: HMSPlaylistType = HMSPlaylistType.audio) =>
  createSelector(selectPlaylistMap(type), selectPlaylistSelection(type), (storePlaylist, currentSelection) => {
    if (!currentSelection.id) {
      return;
    }
    return storePlaylist[currentSelection.id];
  });

export const selectAudioPlaylist: HMSPlaylistSelector = {
  selection: selectPlaylistSelection(HMSPlaylistType.audio),
  progress: selectPlaylistProgress(HMSPlaylistType.audio),
  currentTime: selectPlaylistCurrentTime(HMSPlaylistType.audio),
  playbackRate: selectPlaylistPlaybackRate(HMSPlaylistType.audio),
  volume: selectPlaylistVolume(HMSPlaylistType.audio),
  list: selectPlaylist(HMSPlaylistType.audio),
  selectedItem: selectPlaylistSelectedItem(HMSPlaylistType.audio) as any,
};

export const selectVideoPlaylist: HMSPlaylistSelector = {
  selection: selectPlaylistSelection(HMSPlaylistType.video),
  progress: selectPlaylistProgress(HMSPlaylistType.video),
  currentTime: selectPlaylistCurrentTime(HMSPlaylistType.video),
  playbackRate: selectPlaylistPlaybackRate(HMSPlaylistType.video),
  volume: selectPlaylistVolume(HMSPlaylistType.video),
  list: selectPlaylist(HMSPlaylistType.video),
  selectedItem: selectPlaylistSelectedItem(HMSPlaylistType.video) as any,
};
