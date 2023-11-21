import { HMSPlaylistItem, HMSPlaylistSelection } from './playlist';
import { HMSStore } from './schema';

/**
 * Helpful selectors for audio and video playlist
 */
export interface HMSPlaylistSelector {
  /**
   * returns the playlist items list as set initially
   */
  list: <T>(store: HMSStore) => HMSPlaylistItem<T>[];
  /**
   * This returns playlist selection with `{ id, hasNext, hasPrev }`
   * @returns {HMSPlaylistSelection}
   */
  selection: (store: HMSStore) => HMSPlaylistSelection;
  /**
   * This returns playlist item for corresponding Id in selection
   * @returns {HMSPlaylistItem}
   */
  selectedItem: <T>(store: HMSStore) => HMSPlaylistItem<T>;
  /**
   * returns the current progress percentage, a number between 0-100
   */
  progress: (store: HMSStore) => number;
  /**
   * returns the current volume the playlist is playing at, a number between 0-100
   */
  volume: (store: HMSStore) => number;
  /**
   * returns the current time of the playlist in seconds
   */
  currentTime: (store: HMSStore) => number;
  /**
   * returns the playback rate, a number between 0.25-2.0.
   */
  playbackRate: (store: HMSStore) => number;
}
