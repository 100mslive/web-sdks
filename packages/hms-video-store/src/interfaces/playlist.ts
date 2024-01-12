export enum HMSPlaylistType {
  audio = 'audio',
  video = 'video',
}

export interface HMSPlaylistItem<T> {
  /**
   * uniquely identifies a playlist item
   */
  id: string;
  name: string;
  type: HMSPlaylistType;
  /**
   * the url to play from, local files are not supported currently.
   */
  url: string;
  /**
   * any additional info, for eg. composer, musician etc.
   */
  metadata?: T;
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
  clearList(type: HMSPlaylistType): Promise<void>;
  playNext(type: HMSPlaylistType): Promise<void>;
  playPrevious(type: HMSPlaylistType): Promise<void>;
  removeItem(id: string, type: HMSPlaylistType): Promise<boolean>;
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
  /**
   * Subscriber to progress event with a callback
   * @param fn
   */
  onProgress(fn: (event: HMSPlaylistProgressEvent) => void): void;
  /**
   * This will be called when a new track is played
   * @param fn
   */
  onNewTrackStart<T>(fn: (item: HMSPlaylistItem<T>) => void): void;

  onPlaylistEnded(fn: (type: HMSPlaylistType) => void): void;
  onCurrentTrackEnded<T>(fn: (item: HMSPlaylistItem<T>) => void): void;
  /**
   * Function to autoplay status i.e. whether next item in playlist after the current one ends
   * @param {HMSPlaylistType} type
   * @param {boolean} autoplay
   */
  setIsAutoplayOn(type: HMSPlaylistType, autoplay: boolean): void;
  /**
   * Get the current playback rate of audio/video playlist
   * @param {HMSPlaylistType} type
   */
  getPlaybackRate(type: HMSPlaylistType): number;
  /**
   * set the current playback rate of audio/video playlist
   * @param {HMSPlaylistType}type
   * @param {number}value - number between 0.25 and 2.0
   */
  setPlaybackRate(type: HMSPlaylistType, value: number): void;
}

export interface HMSPlaylistSettings {
  video: {
    bitrate: number;
  };
  audio: {
    bitrate: number;
  };
}
