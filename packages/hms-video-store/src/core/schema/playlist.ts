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
   * Play audio/video passing url and type
   * @param {string} id - id of playlist item
   */
  play(id: string): Promise<void>;
  /**
   * Pause audio/video passing url and type
   * @param {string} id - id of playlist item
   */
  pause(id: string): Promise<void>;
  /**
   * PlayNext audio/video passing type
   */
  playNext(): Promise<void>;
  /**
   * PlayPrevious audio/video passing type
   */
  playPrevious(): Promise<void>;
  /**
   * seek audio/video passing seekValue and type - this is relative to current position
   * @param {number} seekValue - number in seconds to move forwards(pass negative values to move backwards)
   */
  seek(seekValue: number): void;
  /**
   * seek audio/video passing seekValue and type - seekValue will be absolute
   * @param {number} seekValue - value in seconds of absolute position in the playlist item duration
   */
  seekTo(seekValue: number): void;
  /**
   * set audio/video volume passing volume and type
   * @param {number} volume - number between 0-100
   */
  setVolume(volume: number): void;
  /**
   * pass list and type to set audio/video playlist
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
