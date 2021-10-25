import { HMSSdk } from '../sdk';
import { HMSPlaylistItem, HMSPlaylistType, HMSPlaylistManager, HMSPlaylistProgressEvent } from '../interfaces';
import { PlaylistAudioManager } from './PlaylistAudioManager';
import { PlaylistVideoManager } from './PlaylistVideoManager';
import HMSLogger from '../utils/logger';
import { ErrorFactory, HMSAction } from '../error/ErrorFactory';
import { TypedEventEmitter } from '../utils/typed-event-emitter';

type PlaylistManagerState<T> = {
  audio: {
    list: HMSPlaylistItem<T>[];
    currentIndex: number;
    isAutoplayOn: boolean;
  };
  video: {
    list: HMSPlaylistItem<T>[];
    currentIndex: number;
    isAutoplayOn: boolean;
  };
};

const INITIAL_STATE: PlaylistManagerState<any> = {
  audio: {
    list: [],
    currentIndex: -1,
    isAutoplayOn: true,
  },
  video: {
    list: [],
    currentIndex: -1,
    isAutoplayOn: true,
  },
};

export class PlaylistManager
  extends TypedEventEmitter<{
    newTrackStart: HMSPlaylistItem<any>;
    playlistEnded: HMSPlaylistType;
    currentTrackEnded: HMSPlaylistItem<any>;
  }>
  implements HMSPlaylistManager {
  private state = { audio: { ...INITIAL_STATE.audio }, video: { ...INITIAL_STATE.video } };
  private audioManager: PlaylistAudioManager;
  private videoManager: PlaylistVideoManager;

  constructor(private sdk: HMSSdk) {
    super();
    this.audioManager = new PlaylistAudioManager();
    this.videoManager = new PlaylistVideoManager();
    this.addListeners();
  }

  getList<T>(type: HMSPlaylistType = HMSPlaylistType.audio): HMSPlaylistItem<T>[] {
    return this.state[type].list;
  }

  setList<T>(list: HMSPlaylistItem<T>[]): void {
    if (!list || list.length === 0) {
      HMSLogger.w(this.TAG, `Please pass in a list of HMSPlaylistItem's`);
      return;
    }
    list.forEach((item: HMSPlaylistItem<T>) => {
      this.state[item.type].list.push(item);
    });
  }

  removeItem<T>(item: HMSPlaylistItem<T>): void {
    const list = this.state[item.type].list;
    const index = list.findIndex((playItem) => item.id === playItem.id);
    if (index > -1) {
      list.splice(index, 1);
    }
  }

  seek(value: number, type: HMSPlaylistType = HMSPlaylistType.audio): void {
    const { currentIndex } = this.state[type];
    if (currentIndex === -1) {
      throw ErrorFactory.PlaylistErrors.NoEntryToPlay(HMSAction.PLAYLIST, 'No item is currently playing');
    }
    const element = this.getElement(type);
    if (element) {
      let updatedValue = Math.max(element.currentTime + value, 0);
      element.currentTime = Math.min(updatedValue, element.duration);
    }
  }

  seekTo(value: number, type: HMSPlaylistType = HMSPlaylistType.audio): void {
    const { currentIndex } = this.state[type];
    if (currentIndex === -1) {
      throw ErrorFactory.PlaylistErrors.NoEntryToPlay(HMSAction.PLAYLIST, 'No item is currently playing');
    }
    if (value < 0) {
      throw Error('value cannot be negative');
    }
    const element = this.getElement(type);
    if (element) {
      element.currentTime = Math.min(value, element.duration);
    }
  }

  setVolume(value: number, type: HMSPlaylistType = HMSPlaylistType.audio): void {
    if (value < 0 || value > 100) {
      throw Error('Please pass a valid number between 0-100');
    }
    const element = this.getElement(type);
    if (element) {
      element.volume = value * 0.01;
    } else {
      HMSLogger.w(this.TAG, `No valid element of type ${type} found`);
    }
  }

  getVolume(type: HMSPlaylistType = HMSPlaylistType.audio): number {
    const element = this.getElement(type);
    if (element) {
      return element.volume * 100;
    } else {
      HMSLogger.w(this.TAG, `No valid element of type ${type} found`);
    }
    return 0;
  }

  getCurrentTime(type: HMSPlaylistType = HMSPlaylistType.audio) {
    const element = this.getElement(type);
    return element?.currentTime || 0;
  }

  getCurrentIndex(type: HMSPlaylistType = HMSPlaylistType.audio) {
    return this.state[type].currentIndex;
  }

  getCurrentProgress(type: HMSPlaylistType = HMSPlaylistType.audio) {
    const { list, currentIndex } = this.state[type];
    const activeUrl = list[currentIndex]?.url;
    const element = this.getElement(type);
    if (!activeUrl || !element) {
      return 0;
    }
    return Math.floor(100 * (element.currentTime / element.duration));
  }

  getCurrentSelection(type: HMSPlaylistType = HMSPlaylistType.audio) {
    const { list, currentIndex } = this.state[type];
    if (currentIndex === -1) {
      return undefined;
    }
    return list[currentIndex];
  }

  isPlaying(type: HMSPlaylistType = HMSPlaylistType.audio) {
    const element = this.getElement(type);
    return !!element && !element.paused;
  }

  setIsAutoplayOn(type: HMSPlaylistType = HMSPlaylistType.audio, autoplay: boolean) {
    this.state[type].isAutoplayOn = autoplay;
  }

  async setEnabled(
    enabled: boolean,
    { id, type = HMSPlaylistType.audio }: { id: string; type: HMSPlaylistType },
  ): Promise<void> {
    const list = this.state[type].list;
    const currentIndex = list.findIndex((item) => item.id === id);
    if (!id || currentIndex === -1) {
      HMSLogger.w(this.TAG, 'Pass a valid id');
      return;
    }
    const url = this.state[type].list[currentIndex].url;
    if (enabled) {
      await this.play(url, type);
    } else {
      await this.pause(url, type);
    }
    this.state[type].currentIndex = currentIndex;
    this.setDuration(type);
  }

  async playNext(type: HMSPlaylistType = HMSPlaylistType.audio): Promise<void> {
    const { list, currentIndex } = this.state[type];
    if (currentIndex >= list.length - 1) {
      throw ErrorFactory.PlaylistErrors.NoEntryToPlay(HMSAction.PLAYLIST, 'Reached end of playlist');
    }
    await this.play(list[currentIndex + 1].url, type);
    this.state[type].currentIndex = currentIndex + 1;
    this.setDuration(type);
  }

  async playPrevious(type: HMSPlaylistType = HMSPlaylistType.audio): Promise<void> {
    const { list, currentIndex } = this.state[type];
    if (currentIndex <= 0) {
      throw ErrorFactory.PlaylistErrors.NoEntryToPlay(HMSAction.PLAYLIST, 'Reached start of playlist');
    }
    await this.play(list[currentIndex - 1].url, type);
    this.state[type].currentIndex = currentIndex - 1;
    this.setDuration(type);
  }

  async stop(type: HMSPlaylistType = HMSPlaylistType.audio): Promise<void> {
    const manager = type === HMSPlaylistType.audio ? this.audioManager : this.videoManager;
    await this.removeTracks(type);
    manager.stop();
    this.state[type].currentIndex = -1;
  }

  cleanup() {
    this.state = { audio: { ...INITIAL_STATE.audio }, video: { ...INITIAL_STATE.video } };
    this.audioManager.stop();
    this.videoManager.stop();
  }

  onProgress(fn: (progress: HMSPlaylistProgressEvent) => void) {
    this.videoManager.on('progress', () => {
      try {
        fn({
          type: HMSPlaylistType.video,
          progress: this.getCurrentProgress(HMSPlaylistType.video),
        });
      } catch (error) {
        HMSLogger.e(this.TAG, 'Error in onProgress callback');
      }
    });
    this.audioManager.on('progress', () => {
      try {
        fn({
          type: HMSPlaylistType.audio,
          progress: this.getCurrentProgress(HMSPlaylistType.audio),
        });
      } catch (error) {
        HMSLogger.e(this.TAG, 'Error in onProgress callback');
      }
    });
  }

  onNewTrackStart<T>(fn: (item: HMSPlaylistItem<T>) => void) {
    this.on('newTrackStart', fn);
  }

  onPlaylistEnded(fn: (type: HMSPlaylistType) => void) {
    this.on('playlistEnded', fn);
  }

  onCurrentTrackEnded<T>(fn: (item: HMSPlaylistItem<T>) => void) {
    this.on('currentTrackEnded', fn);
  }

  private getElement(type: HMSPlaylistType = HMSPlaylistType.audio) {
    return type === HMSPlaylistType.audio ? this.audioManager.getElement() : this.videoManager.getElement();
  }

  private async removeTracks(type: HMSPlaylistType = HMSPlaylistType.audio) {
    const manager = type === HMSPlaylistType.audio ? this.audioManager : this.videoManager;
    const tracks = manager.getTracks();
    for (let trackId of tracks) {
      await this.removeTrack(trackId);
    }
  }

  private async play(url: string, type: HMSPlaylistType = HMSPlaylistType.audio): Promise<void> {
    const element = this.getElement(type);
    if (element && !element.paused && element.src.includes(url)) {
      HMSLogger.w(this.TAG, `The ${type} is currently playing`);
      return;
    }
    if (element && element.src.includes(url)) {
      await element.play();
    } else {
      element?.pause();
      let tracks: MediaStreamTrack[];
      if (type === HMSPlaylistType.audio) {
        tracks = await this.audioManager.play(url);
      } else {
        tracks = await this.videoManager.play(url);
      }
      for (const track of tracks) {
        await this.addTrack(track, type === HMSPlaylistType.audio ? 'audioplaylist' : 'videoplaylist');
      }
    }
  }

  private setDuration(type: HMSPlaylistType = HMSPlaylistType.audio) {
    const element = this.getElement(type);
    const { list, currentIndex } = this.state[type];
    if (list[currentIndex]) {
      list[currentIndex].duration = element?.duration || 0;
    }
    this.emit('newTrackStart', list[currentIndex]);
  }

  private async pause(url: string, type: HMSPlaylistType = HMSPlaylistType.audio): Promise<void> {
    const el = this.getElement(type);
    if (el && !el.paused && el.src.includes(url)) {
      el.pause();
      HMSLogger.d(this.TAG, 'paused url', url);
    } else {
      HMSLogger.w(this.TAG, 'The passed in url is not currently playing');
    }
  }

  private addListeners() {
    this.audioManager.on('ended', () => this.handleEnded(HMSPlaylistType.audio));
    this.videoManager.on('ended', () => this.handleEnded(HMSPlaylistType.video));
  }

  /**
   * Remove tracks if reached the end of list otherwise play next
   * @param {HMSPlaylistType} type
   */
  private async handleEnded(type: HMSPlaylistType = HMSPlaylistType.audio) {
    const { list, currentIndex, isAutoplayOn } = this.state[type];
    if (currentIndex === list.length - 1) {
      await this.stop(type);
      this.emit('playlistEnded', type);
    } else {
      if (isAutoplayOn) {
        this.playNext(type);
      } else {
        // when autoplay not allowed, pause the media element
        await this.pause(list[currentIndex].url, type);
      }
    }
    this.emit('currentTrackEnded', list[currentIndex]);
  }

  private addTrack = async (track: MediaStreamTrack, source: string) => {
    await this.sdk.addTrack(track, source);
    HMSLogger.d(this.TAG, 'Playlist track added', track);
  };

  private removeTrack = async (trackId: string) => {
    await this.sdk.removeTrack(trackId);
    HMSLogger.d(this.TAG, 'Playlist track removed', trackId);
  };

  private get TAG() {
    return 'PlaylistManager';
  }
}
