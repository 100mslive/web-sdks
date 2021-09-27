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
  };
  video: {
    list: Record<string, HMSPlaylistItem<T>>;
    selection: HMSPlaylistSelection;
    progress: number;
    volume: number;
    currentTime: number;
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
   * @param {HMSPlaylistItem[]} - list of playlist items
   */
  setList<T>(list: HMSPlaylistItem<T>[]): void;
  /**
   * Stop the current playback and remove the tracks
   */
  stop(): Promise<void>;
}

export interface HMSPlaylistSelector {
  list: <T>(store: HMSStore) => HMSPlaylistItem<T>[];
  /**
   * This returns playlist selection with id, hasNext, hasPrev
   * @returns {HMSPlaylistSelection}
   */
  selection: (store: HMSStore) => HMSPlaylistSelection;
  /**
   * This returns playlist item for corresponding Id in selection
   * @returns {HMSPlaylistItem}
   */
  selectedItem: <T>(store: HMSStore) => HMSPlaylistItem<T>;
  progress: (store: HMSStore) => number;
  volume: (store: HMSStore) => number;
  currentTime: (store: HMSStore) => number;
}
