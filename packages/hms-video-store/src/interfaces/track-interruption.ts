/**
 * Emitted when a local track stops/starts producing media because the OS or another app took over
 * the device - a phone call, a native voip app, or the tab going to background on mobile.
 */
export interface HMSTrackInterruption {
  /** true when the interruption starts, false when it ends */
  started: boolean;
  /** what triggered the interruption, eg. track-muted-natively, visibility-change */
  reason: string;
  type: 'audio' | 'video';
  trackId: string;
}

export interface TrackInterruptionListener {
  onTrackInterruption?(interruption: HMSTrackInterruption): void;
}
