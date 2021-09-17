import { createSelector } from 'reselect';
import { HMSPlaylistType, HMSStore, HMSPlaylistSelector } from '../schema';

/**
 * @internal
 */
const selectPlaylistMap = (type: HMSPlaylistType = HMSPlaylistType.audio) => (store: HMSStore) =>
  store.playlist[type].list;

const selectPlaylistSelection = (type: HMSPlaylistType = HMSPlaylistType.audio) => (
  store: HMSStore,
) => store.playlist[type].selection;

const selectPlaylistProgress = (type: HMSPlaylistType = HMSPlaylistType.audio) => (
  store: HMSStore,
) => store.playlist[type].progress;

const selectPlaylistVolume = (type: HMSPlaylistType = HMSPlaylistType.audio) => (store: HMSStore) =>
  store.playlist[type].volume;

/**
 * Select an array of playlist items.
 */
const selectPlaylist = (type: HMSPlaylistType = HMSPlaylistType.audio) =>
  createSelector(selectPlaylistMap(type), storePlaylist => {
    return Object.values(storePlaylist);
  });

const selectPlaylistSelectedItem = (type: HMSPlaylistType = HMSPlaylistType.audio) =>
  createSelector(
    selectPlaylistMap(type),
    selectPlaylistSelection(type),
    (storePlaylist, currentSelection) => {
      if (!currentSelection.id) {
        return;
      }
      return storePlaylist[currentSelection.id];
    },
  );

export const selectAudioPlaylist: HMSPlaylistSelector = {
  selection: createSelector(selectPlaylistSelection(HMSPlaylistType.audio), selection => selection),
  progress: createSelector(selectPlaylistProgress(HMSPlaylistType.audio), progress => progress),
  volume: createSelector(selectPlaylistVolume(HMSPlaylistType.audio), volume => volume),
  list: createSelector(selectPlaylist(HMSPlaylistType.audio), list => list),
  selectedItem: <any>(
    createSelector(selectPlaylistSelectedItem(HMSPlaylistType.audio), selectedItem => selectedItem)
  ),
};

export const selectVideoPlaylist: HMSPlaylistSelector = {
  selection: createSelector(selectPlaylistSelection(HMSPlaylistType.video), selection => selection),
  progress: createSelector(selectPlaylistProgress(HMSPlaylistType.video), progress => progress),
  volume: createSelector(selectPlaylistVolume(HMSPlaylistType.video), volume => volume),
  list: createSelector(selectPlaylist(HMSPlaylistType.video), list => list),
  selectedItem: <any>(
    createSelector(selectPlaylistSelectedItem(HMSPlaylistType.video), selectedItem => selectedItem)
  ),
};
