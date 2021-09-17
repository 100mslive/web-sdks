import { HMSPlaylistItem, HMSPlaylistType, HMSStore, IHMSPlaylistActions } from '../schema';
import { HMSPlaylistManager } from './sdkTypes';
import { HMSLogger } from '../../common/ui-logger';
import { SDKToHMS } from './adapter';

export class HMSPlaylist implements IHMSPlaylistActions {
  private type: HMSPlaylistType;
  constructor(
    private playlistManager: HMSPlaylistManager,
    type: HMSPlaylistType,
    private syncRoomState: (name: string) => void,
    private setState: (fn: (store: HMSStore) => void, name: string) => void,
  ) {
    this.type = type;
  }

  async play(id: string): Promise<void> {
    if (!id) {
      HMSLogger.w('Please pass id and type to pause');
      return;
    }
    await this.playlistManager.setEnabled(true, { id, type: this.type });
    this.syncRoomState(`playOn${this.type}Playlist`);
  }
  async pause(id: string): Promise<void> {
    if (!id) {
      HMSLogger.w('Please pass id and type to pause');
      return;
    }
    await this.playlistManager.setEnabled(false, { id, type: this.type });
    this.syncRoomState(`pauseOn${this.type}Playlist`);
  }
  async playNext(): Promise<void> {
    await this.playlistManager.playNext(this.type);
    this.syncRoomState(`playPreviousOn${this.type}Playlist`);
  }
  async playPrevious(): Promise<void> {
    await this.playlistManager.playPrevious(this.type);
    this.syncRoomState(`playPreviousOn${this.type}Playlist`);
  }
  seek(seekValue: number): void {
    this.playlistManager.seek(seekValue, this.type);
    this.setState(draftStore => {
      draftStore.playlist[this.type].progress = SDKToHMS.convertPlaylist(this.playlistManager)[
        this.type
      ].progress;
    }, `seekOn${this.type}Playlist`);
  }
  seekTo(seekValue: number): void {
    this.playlistManager.seekTo(seekValue, this.type);
    this.setState(draftStore => {
      draftStore.playlist[this.type].progress = SDKToHMS.convertPlaylist(this.playlistManager)[
        this.type
      ].progress;
    }, `seekToOn${this.type}Playlist`);
  }
  setVolume(volume: number): void {
    this.playlistManager.setVolume(volume, this.type);
    this.setState(draftStore => {
      draftStore.playlist[this.type].volume = SDKToHMS.convertPlaylist(this.playlistManager)[
        this.type
      ].volume;
    }, `setVolumeOn${this.type}Playlist`);
  }
  setList<T>(list: HMSPlaylistItem<T>[]): void {
    this.playlistManager.setList(list);
    this.syncRoomState(`setListOn${this.type}Playlist`);
  }
  async stop(): Promise<void> {
    await this.playlistManager.stop(this.type);
    this.syncRoomState(`stop${this.type}Playlist`);
  }

  getCurrentTime() {
    return this.playlistManager.getCurrentTime(this.type);
  }
}
