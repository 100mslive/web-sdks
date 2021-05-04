import HMSUpdateListener, { HMSPeerUpdate } from '../interfaces/update-listener';
import Peer from '../peer';
import HMSLogger from '../utils/logger';
import { Speaker } from './models/HMSNotifications';

const CHECK_ACTIVE_SPEAKERS_INTERVAL = 1000;

export class HMSAudioLevelListener {
  private TAG: string = '[HMSAudioLevelListener]:';
  private recentUpdate: Date | null = null;
  private listener!: HMSUpdateListener | null;
  dominantSpeaker: Peer | null = null;

  /**
   * Update timestamp on every active speaker message received.
   * Check every [CHECK_ACTIVE_SPEAKERS_INTERVAL ms] if a more recent message has been received.
   * If not received, no one is speaking - resign domninant speaker.
   */
  updateDominantSpeaker(speaker: Speaker, peer: Peer, listener: HMSUpdateListener) {
    this.listener = listener;

    if (!this.recentUpdate) {
      /**
       * CASE: Whole room silent to some active speakers.
       * Update recentUpdate timestamp, Send BECAME_DOMINANT_SPEAKER update and initiate periodic method to check recent update.
       */
      this.recentUpdate = new Date();
      this.dominantSpeaker = peer;
      HMSLogger.d(this.TAG, `BECAME_DOMINANT_SPEAKER`, speaker, peer);
      this.listener!.onPeerUpdate(HMSPeerUpdate.BECAME_DOMINANT_SPEAKER, peer);

      const updateTimer = setInterval(() => {
        const now = new Date();
        if (this.recentUpdate && now.getTime() - this.recentUpdate.getTime() > CHECK_ACTIVE_SPEAKERS_INTERVAL) {
          this.recentUpdate = null;
          HMSLogger.d(this.TAG, `RESIGNED_DOMINANT_SPEAKER`, this.dominantSpeaker);
          this.listener!.onPeerUpdate(HMSPeerUpdate.RESIGNED_DOMINANT_SPEAKER, this.dominantSpeaker!);
          this.dominantSpeaker = null;
          clearInterval(updateTimer);
        }
      }, CHECK_ACTIVE_SPEAKERS_INTERVAL);
    } else {
      /**
       * CASE: Some active speakers to some active speakers.
       * Update recentUpdate timestamp and Send BECAME_DOMINANT_SPEAKER update.
       */
      this.recentUpdate = new Date();
      this.dominantSpeaker = peer;
      HMSLogger.d(this.TAG, `BECAME_DOMINANT_SPEAKER`, speaker, peer);
      this.listener!.onPeerUpdate(HMSPeerUpdate.BECAME_DOMINANT_SPEAKER, peer);
    }
  }
}
