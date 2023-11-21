import { HMSLogger } from '../common/ui-logger';
import { IHMSStore } from '../IHMSStore';
import { HMSPlaylistManager } from '../internal';
import { HMSGenericTypes, HMSPlaylistItem, HMSPlaylistType, IHMSPlaylistActions } from '../schema';
import { selectAudioPlaylist, selectVideoPlaylist } from '../selectors';

export class HMSPlaylist<T extends HMSGenericTypes> implements IHMSPlaylistActions {
  private type: HMSPlaylistType;
  constructor(
    private playlistManager: HMSPlaylistManager,
    type: HMSPlaylistType,
    private syncPlaylistState: (action: string) => void,
    private store: IHMSStore<T>,
  ) {
    this.type = type;
  }

  async play(id: string): Promise<void> {
    if (!id) {
      HMSLogger.w('Please pass id to play');
      return;
    }
    await this.playlistManager.setEnabled(true, { id, type: this.type });
  }

  async pause(): Promise<void> {
    const selector = this.type === HMSPlaylistType.audio ? selectAudioPlaylist : selectVideoPlaylist;
    const selection = this.store.getState(selector.selection);
    if (!selection.id) {
      HMSLogger.w('No item is currently playing to pause');
      return;
    }
    await this.playlistManager.setEnabled(false, { id: selection.id, type: this.type });
  }

  async playNext(): Promise<void> {
    await this.playlistManager.playNext(this.type);
  }

  async playPrevious(): Promise<void> {
    await this.playlistManager.playPrevious(this.type);
  }

  seek(seekValue: number): void {
    this.playlistManager.seek(seekValue, this.type);
    this.syncPlaylistState(`seekOn${this.type}Playlist`);
  }

  seekTo(seekValue: number): void {
    this.playlistManager.seekTo(seekValue, this.type);
    this.syncPlaylistState(`seekToOn${this.type}Playlist`);
  }

  setVolume(volume: number): void {
    this.playlistManager.setVolume(volume, this.type);
    this.syncPlaylistState(`setVolumeOn${this.type}Playlist`);
  }

  setList<T>(list: HMSPlaylistItem<T>[]): void {
    this.playlistManager.setList(list);
    this.syncPlaylistState(`setListOn${this.type}Playlist`);
  }

  async stop(): Promise<void> {
    await this.playlistManager.stop(this.type);
    this.syncPlaylistState(`stop${this.type}Playlist`);
  }

  setIsAutoplayOn(autoplay: boolean) {
    this.playlistManager.setIsAutoplayOn(this.type, autoplay);
  }

  setPlaybackRate(playbackRate: number) {
    this.playlistManager.setPlaybackRate(this.type, playbackRate);
    this.syncPlaylistState(`set${this.type}PlaybackRate`);
  }

  async removeItem(id: string) {
    const removed = await this.playlistManager.removeItem(id, this.type);
    if (removed) {
      this.syncPlaylistState(`remove${this.type}PlaylistItem`);
    }
    return removed;
  }

  async clearList() {
    await this.playlistManager.clearList(this.type);
    this.syncPlaylistState(`clear${this.type}Playlist`);
  }
}
