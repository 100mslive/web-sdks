export enum HMSPlaylistType {
  audio = 'audio',
  video = 'video',
}

export interface HMSPlaylistItem<T> {
  name: string;
  metadata?: T;
  id: string;
  url: string;
  type: HMSPlaylistType;
  /**
   * duration in seconds
   */
  duration?: number;
}

export interface HMSPlaylistProgressEvent {
  type: HMSPlaylistType;
  progress: number;
}

export interface HMSPlaylistManager {
  getList<T>(type: HMSPlaylistType): HMSPlaylistItem<T>[];
  setList<T>(list: HMSPlaylistItem<T>[]): void;
  playNext(type: HMSPlaylistType): Promise<void>;
  playPrevious(type: HMSPlaylistType): Promise<void>;
  removeItem<T>(item: HMSPlaylistItem<T>): void;
  /**
   * Seek forward/backward on selected type relative to currentTime
   * @param value - number in seconds to go forward(if negative, it goes backwards)
   * @param {HMSPlaylistType} type
   */
  seek(value: number, type: HMSPlaylistType): void;
  /**
   * Seek forward/backward on selected type - absolute value
   * @param value - point in playlist item to go to
   * @param {HMSPlaylistType} type
   */
  seekTo(value: number, type: HMSPlaylistType): void;
  /**
   * set volume on the selected type
   * @param value - number between 0-100
   * @param type
   */
  setVolume(value: number, type: HMSPlaylistType): void;
  /**
   * Get volume of selected type, between 0-100
   * @param type
   */
  getVolume(type: HMSPlaylistType): number;
  isPlaying(type: HMSPlaylistType): boolean;
  getCurrentIndex(type: HMSPlaylistType): number;
  getCurrentSelection<T>(type: HMSPlaylistType): HMSPlaylistItem<T> | undefined;
  /**
   * Returns a value between 0-100
   * @param {HMSPlaylistType} type
   */
  getCurrentProgress(type: HMSPlaylistType): number;
  /**
   * Get the currentTime of audio/video based on type
   * @param {HMSPlaylistType} type
   */
  getCurrentTime(type: HMSPlaylistType): number;
  setEnabled(enabled: boolean, info: { id: string; type: HMSPlaylistType }): Promise<void>;
  stop(type: HMSPlaylistType): Promise<void>;
  onProgress(fn: (event: HMSPlaylistProgressEvent) => void): void;
}
