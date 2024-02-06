import Hls, { Fragment } from 'hls.js';
import { HMSHLSErrorFactory } from '../error/HMSHLSErrorFactory';
import { HMSHLSPlayerListeners } from '../interfaces/events';
import { HMSHLSPlayerEvents } from '../utilies/constants';
import { metadataPayloadParser } from '../utilies/utils';

export class HMSHLSTimedMetadata {
  private hls: Hls;
  constructor(
    hls: Hls,
    private videoEl: HTMLVideoElement,
    private emitEvent: <E extends HMSHLSPlayerEvents>(
      eventName: E,
      eventObject: Parameters<HMSHLSPlayerListeners<E>>[0],
    ) => boolean,
  ) {
    this.hls = hls;
    this.registerListner();
  }
  extractMetaTextTrack = (): TextTrack | null => {
    const textTrackListCount = this.videoEl.textTracks.length || 0;
    for (let trackIndex = 0; trackIndex < textTrackListCount; trackIndex++) {
      const textTrack = this.videoEl.textTracks[trackIndex];
      if (textTrack?.kind !== 'metadata') {
        continue;
      }
      textTrack.mode = 'showing';
      return textTrack;
    }
    return null;
  };

  // sync time with cue and trigger event
  fireCues = (currentAbsTime: number, tolerance: number) => {
    const cues = this.extractMetaTextTrack()?.cues;
    if (!cues) {
      return;
    }
    const cuesLength = cues.length;
    let cueIndex = 0;
    while (cueIndex < cuesLength) {
      const cue = cues[cueIndex] as TextTrackCue & {
        queued: boolean;
        value: { data: string };
      };
      if (cue.queued) {
        cueIndex++;
        continue;
      }
      // here we are converting base64 to actual data.
      const data: Record<string, any> = metadataPayloadParser(cue.value.data);
      const startDate = data.start_date;
      const endDate = data.end_date;
      const timeDiff = new Date(startDate).getTime() - currentAbsTime;
      const duration = new Date(endDate).getTime() - new Date(startDate).getTime();
      if (timeDiff <= tolerance) {
        setTimeout(() => {
          this.emitEvent(HMSHLSPlayerEvents.TIMED_METADATA_LOADED, {
            id: cue?.id,
            payload: data.payload,
            duration: duration,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          });
        }, timeDiff);
        cue.queued = true;
      }
      cueIndex++;
    }
  };

  // handle time update listener
  handleTimeUpdateListener = () => {
    // extract timed metadata text track
    const metaTextTrack: TextTrack | null = this.extractMetaTextTrack();
    if (!metaTextTrack || !metaTextTrack.cues) {
      return;
    }
    // @ts-ignore
    const firstFragProgramDateTime = this.videoEl?.getStartDate() || 0;
    const currentAbsTime = new Date(firstFragProgramDateTime).getTime() + (this.videoEl.currentTime || 0) * 1000;
    // fire cue for timed meta data extract
    this.fireCues(currentAbsTime, 0.25);
  };
  /**
   * Metadata are automatically parsed and added to the video element's
   * textTrack cue by hlsjs as they come through the stream.
   * in FRAG_CHANGED, we read the cues and emitEvent HLS_METADATA_LOADED
   * when the current fragment has a metadata to play.
   */
  fragChangeHandler = (_: any, { frag }: { frag: Fragment }) => {
    if (!this.videoEl) {
      const error = HMSHLSErrorFactory.HLSMediaError.videoElementNotFound();
      this.emitEvent(HMSHLSPlayerEvents.ERROR, error);
    }
    try {
      if (this.videoEl.textTracks.length === 0) {
        return;
      }
      const fragStartTime = frag.programDateTime || 0;
      const fragmentDuration = frag.end - frag.start;
      this.fireCues(fragStartTime, fragmentDuration);
    } catch (e) {
      console.error('FRAG_CHANGED event error', e);
    }
  };
  private registerListner = () => {
    if (Hls.isSupported()) {
      this.hls.on(Hls.Events.FRAG_CHANGED, this.fragChangeHandler);
    } else if (this.videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      this.videoEl.addEventListener('timeupdate', this.handleTimeUpdateListener);
    }
  };

  unregisterListener = () => {
    this.hls.off(Hls.Events.FRAG_CHANGED, this.fragChangeHandler);
    this.videoEl.removeEventListener('timeupdate', this.handleTimeUpdateListener);
  };
}
