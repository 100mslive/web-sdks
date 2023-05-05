import { HMSStore } from '../schema';

export enum HMSPlaylistType {
  audio = 'audio',
  video = 'video',
}
export interface HMSPlaylistItem<T> {
  name: string;
  id: string;
  metadata?: T;
  url: string;
  type: HMSPlaylistType;
  duration?: number;
  playing: boolean;
  selected: boolean;
}

export interface HMSPlaylistSelection {
  id: string;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface HMSPlaylist<T> {
  audio: {
    list: Record<string, HMSPlaylistItem<T>>;
    selection: HMSPlaylistSelection;
    progress: number;
    volume: number;
    currentTime: number;
    playbackRate: number;
  };
  video: {
    list: Record<string, HMSPlaylistItem<T>>;
    selection: HMSPlaylistSelection;
    progress: number;
    volume: number;
    currentTime: number;
    playbackRate: number;
  };
}

export interface IHMSPlaylistActions {
  /**
   * Pass the id of the item to be played
   * @param {string} id - id of playlist item
   */
  play(id: string): Promise<void>;
  /**
   * Pauses current playing item
   */
  pause(): Promise<void>;
  /**
   * PlayNext
   */
  playNext(): Promise<void>;
  /**
   * PlayPrevious
   */
  playPrevious(): Promise<void>;
  /**
   * seek passing seekValue - this is relative to current position
   * @param {number} seekValue - number in seconds to move forwards(pass negative values to move backwards)
   */
  seek(seekValue: number): void;
  /**
   * seek passing seekValue  - seekValue will be absolute
   * @param {number} seekValue - value in seconds of absolute position in the playlist item duration
   */
  seekTo(seekValue: number): void;
  /**
   * set volume passing volume
   * @param {number} volume - number between 0-100
   */
  setVolume(volume: number): void;
  /**
   * pass list to set playlist
   * @param {HMSPlaylistItem[]} list of playlist items
   */
  setList<T>(list: HMSPlaylistItem<T>[]): void;
  /**
   * Stop the current playback and remove the tracks
   */
  stop(): Promise<void>;
  /**
   * set whether to autoplay next item in playlist after the current one ends
   * @param {boolean} autoplay
   */
  setIsAutoplayOn(autoplay: boolean): void;
  /**
   * Control the playback speed - 1.0 being normal, less than 1.0 will play it slowly
   * and more than 1.0 will play it faster.
   * @param playbackRate - value from 0.25 and 2.0
   */
  setPlaybackRate(playbackRate: number): void;
  removeItem(id: string): Promise<boolean>;
  clearList(): Promise<void>;
}

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
