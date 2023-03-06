import Hls from 'hls.js';
import { HMSHLSPlayer } from './HMSHLSPlayer';
import { HMSHLSPlayerEvents } from '../utilies/constants';

export class HMSHLSMetadata {
  private hlsPlayer: HMSHLSPlayer;
  private videoEl: HTMLVideoElement;
  constructor(hls: HMSHLSPlayer, videoEl: HTMLVideoElement) {
    this.hlsPlayer = hls;
    this.videoEl = videoEl;
  }
  private extractMetaTextTrack = (): TextTrack | null => {
    const textTrackListCount = this.videoEl?.textTracks.length || 0;
    for (let trackIndex = 0; trackIndex < textTrackListCount; trackIndex++) {
      const textTrack = this.videoEl?.textTracks[trackIndex];
      if (textTrack?.kind !== 'metadata') {
        continue;
      }
      textTrack.mode = 'showing';
      return textTrack;
    }
    return null;
  };
  private fireCues = (cues: TextTrackCueList) => {
    const cuesLength = cues.length;
    let cueIndex = 0;
    while (cueIndex < cuesLength) {
      const cue: TextTrackCue = cues[cueIndex];
      // @ts-ignore
      if (cue.fired) {
        cueIndex++;
        continue;
      }
      // @ts-ignore
      const data: { [key: string]: string } = metadataPayloadParser(cue.value.data);
      // @ts-ignore
      const programData = this.videoEl?.getStartDate();
      const startDate = data.start_date;
      const endDate = data.end_date;
      const startTime =
        new Date(startDate).getTime() - new Date(programData).getTime() - (this.videoEl?.currentTime || 0) * 1000;
      const duration = new Date(endDate).getTime() - new Date(startDate).getTime();
      setTimeout(() => {
        this.hlsPlayer.emit(HMSHLSPlayerEvents.TIMED_METADATA_LOADED, {
          payload: data.payload,
          duration: duration,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        });
      }, startTime);
      // @ts-ignore
      cue.fired = true;
      cueIndex++;
    }
  };
  private handleTimedMetaData = () => {
    if (Hls.isSupported() || !this.videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      return;
    }
    // extracct timed metadata text track
    const metaTextTrack: TextTrack | null = this.extractMetaTextTrack();
    if (!metaTextTrack || !metaTextTrack.cues) {
      return;
    }
    // fire cue for timed meta data extract
    this.fireCues(metaTextTrack.cues);
  };
  startMetadataListner = () => {
    this.videoEl.addEventListener('timeupdate', this.handleTimedMetaData);
  };

  endMetaListner = () => {
    this.videoEl.removeEventListener('timeupdate', this.handleTimedMetaData);
  };
}
