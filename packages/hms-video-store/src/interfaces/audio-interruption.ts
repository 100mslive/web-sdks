/**
 * Emitted when the local audio track stops/starts producing media because the OS or another
 * app took over the microphone - a phone call, a native voip app, or the tab going to background
 * on mobile browsers.
 */
export interface HMSAudioInterruption {
  /** true when the interruption starts, false when it ends */
  started: boolean;
  /** what triggered the interruption, eg. track-muted-natively, visibility-change */
  reason: string;
  trackId: string;
}

export interface AudioInterruptionListener {
  onAudioInterruption?(interruption: HMSAudioInterruption): void;
}
