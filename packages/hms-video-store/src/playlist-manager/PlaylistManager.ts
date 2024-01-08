import { PlaylistAudioManager } from './PlaylistAudioManager';
import { PlaylistVideoManager } from './PlaylistVideoManager';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { EventBus } from '../events/EventBus';
import { HMSPlaylistItem, HMSPlaylistManager, HMSPlaylistProgressEvent, HMSPlaylistType } from '../interfaces';
import { HMSLocalTrack } from '../media/tracks';
import { HMSSdk } from '../sdk';
import { stringifyMediaStreamTrack } from '../utils/json';
import HMSLogger from '../utils/logger';
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
  implements HMSPlaylistManager
{
  private state = { audio: { ...INITIAL_STATE.audio }, video: { ...INITIAL_STATE.video } };
  private audioManager: PlaylistAudioManager;
  private videoManager: PlaylistVideoManager;
  private readonly TAG = '[PlaylistManager]';

  constructor(private sdk: HMSSdk, private eventBus: EventBus) {
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
      if (!this.state[item.type].list.find(_item => _item.id === item.id)) {
        this.state[item.type].list.push(item);
      }
    });
  }

  async clearList(type: HMSPlaylistType): Promise<void> {
    if (this.isPlaying(type)) {
      await this.stop(type);
    }
    this.state[type].list = [];
  }

  async removeItem(id: string, type: HMSPlaylistType): Promise<boolean> {
    const { list, currentIndex } = this.state[type];
    const index = list.findIndex(playItem => id === playItem.id);
    if (index > -1) {
      // stop if the item is playing
      if (currentIndex === index && this.isPlaying(type)) {
        await this.stop(type);
      }
      list.splice(index, 1);
      return true;
    }
    return false;
  }

  seek(value: number, type: HMSPlaylistType = HMSPlaylistType.audio): void {
    const { currentIndex } = this.state[type];
    if (currentIndex === -1) {
      throw ErrorFactory.PlaylistErrors.NoEntryToPlay(HMSAction.PLAYLIST, 'No item is currently playing');
    }
    const element = this.getElement(type);
    if (element) {
      const updatedValue = Math.max(element.currentTime + value, 0);
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
    }
  }

  getVolume(type: HMSPlaylistType = HMSPlaylistType.audio): number {
    const element = this.getElement(type);
    if (element) {
      return Math.floor(element.volume * 100);
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

  getPlaybackRate(type: HMSPlaylistType = HMSPlaylistType.audio) {
    const element = this.getElement(type);
    return element ? element.playbackRate : 1.0;
  }

  setPlaybackRate(type: HMSPlaylistType = HMSPlaylistType.audio, value: number) {
    if (value < 0.25 || value > 2.0) {
      throw Error('Please pass a value between 0.25 and 2.0');
    }
    const element = this.getElement(type);
    if (element) {
      element.playbackRate = value;
    }
  }

  async setEnabled(
    enabled: boolean,
    { id, type = HMSPlaylistType.audio }: { id: string; type: HMSPlaylistType },
  ): Promise<void> {
    const list = this.state[type].list;
    const currentIndex = list.findIndex(item => item.id === id);
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
    manager.getElement()?.pause(); //pause local video/audio and remove tracks in next step
    await this.removeTracks(type);
    manager.stop();
    this.state[type].currentIndex = -1;
  }

  cleanup() {
    this.state = { audio: { ...INITIAL_STATE.audio }, video: { ...INITIAL_STATE.video } };
    this.eventBus.localAudioEnabled.unsubscribe(this.handlePausePlaylist);
    this.eventBus.localVideoEnabled.unsubscribe(this.handlePausePlaylist);
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
    for (const trackId of tracks) {
      await this.removeTrack(trackId);
    }
  }

  private async play(url: string, type: HMSPlaylistType = HMSPlaylistType.audio): Promise<void> {
    const manager = type === HMSPlaylistType.audio ? this.audioManager : this.videoManager;
    const element = manager.getElement();
    if (this.isItemCurrentlyPlaying(url, type)) {
      HMSLogger.w(this.TAG, `The ${type} is currently playing`);
      return;
    }
    if (element?.src.includes(url)) {
      await element.play();
    } else {
      element?.pause();
      const tracks: MediaStreamTrack[] = await manager.play(url);
      for (const track of tracks) {
        await this.addTrack(track, type === HMSPlaylistType.audio ? 'audioplaylist' : 'videoplaylist');
      }
    }
  }

  private isItemCurrentlyPlaying(url: string, type: HMSPlaylistType): boolean {
    const element = this.getElement(type);
    return !!(element && !element.paused && element.src.includes(url));
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

  private handlePausePlaylist = async ({ enabled, track }: { enabled: boolean; track: HMSLocalTrack }) => {
    if (enabled) {
      return;
    }
    let type: HMSPlaylistType | undefined = undefined;
    if (track.source === 'audioplaylist') {
      type = HMSPlaylistType.audio;
    }
    if (track.source === 'videoplaylist') {
      type = HMSPlaylistType.video;
    }
    if (!type) {
      return;
    }
    this.getElement(type)?.pause();
  };

  private addListeners() {
    this.audioManager.on('ended', () => this.handleEnded(HMSPlaylistType.audio));
    this.videoManager.on('ended', () => this.handleEnded(HMSPlaylistType.video));
    this.eventBus.localAudioEnabled.subscribe(this.handlePausePlaylist);
    this.eventBus.localVideoEnabled.subscribe(this.handlePausePlaylist);
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
    HMSLogger.d(this.TAG, 'Playlist track added', stringifyMediaStreamTrack(track));
  };

  private removeTrack = async (trackId: string) => {
    await this.sdk.removeTrack(trackId, true);
    HMSLogger.d(this.TAG, 'Playlist track removed', trackId);
  };
}
