/**
 * Emitted when a local track stops/starts producing media because the OS or another app took over
 * the device - a phone call or a native voip app.
 *
 * Only raised for a device the user can do something about: the page is visible and the device is
 * really not capturing. Backgrounding the tab on mobile stops the device too, but it is handed back
 * on return, so that on its own is not reported - if it does not come back, the interruption is
 * raised once the page is visible again.
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
