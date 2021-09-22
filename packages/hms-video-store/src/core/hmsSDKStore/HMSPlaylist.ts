import { HMSPlaylistItem, HMSPlaylistType, IHMSPlaylistActions } from '../schema';
import { HMSPlaylistManager } from './sdkTypes';
import { HMSLogger } from '../../common/ui-logger';

export class HMSPlaylist implements IHMSPlaylistActions {
  private type: HMSPlaylistType;
  constructor(
    private playlistManager: HMSPlaylistManager,
    type: HMSPlaylistType,
    private syncPlaylistState: (action: string) => void,
  ) {
    this.type = type;
  }

  async play(id: string): Promise<void> {
    if (!id) {
      HMSLogger.w('Please pass id and type to pause');
      return;
    }
    await this.playlistManager.setEnabled(true, { id, type: this.type });
  }

  async pause(id: string): Promise<void> {
    if (!id) {
      HMSLogger.w('Please pass id and type to pause');
      return;
    }
    await this.playlistManager.setEnabled(false, { id, type: this.type });
    this.syncPlaylistState(`pauseOn${this.type}Playlist`);
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
}
