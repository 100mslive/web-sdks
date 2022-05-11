import { IStore } from '../sdk/store/IStore';
import { HMSRemoteVideoTrack } from '../media/tracks';
import HMSLogger from '../utils/logger';
import { EventBus } from '../events/EventBus';

/** @see docs/Subscribe-Degradation.md */
export class TrackDegradationController {
  private readonly TAG = '[TrackDegradationController]';
  private readonly PACKETS_LOST_THRESHOLD: number;
  private readonly MIN_DEGRADE_GRACE_PERIOD: number;
  private readonly MIN_RECOVER_GRACE_PERIOD: number;
  private readonly MAX_RECOVER_GRACE_PERIOD = 120;

  private recoveringTrack?: HMSRemoteVideoTrack;
  private degradeGracePeriod: number;
  private recoverGracePeriod: number;
  private recoverAttemptCount = 0;
  private packetsLost = 0;

  private get isAttemptingRecover() {
    return Boolean(this.recoveringTrack);
  }

  constructor(private readonly store: IStore, private readonly eventBus: EventBus) {
    const storeParams = this.store.getSubscribeDegradationParams()!;
    this.PACKETS_LOST_THRESHOLD = storeParams.packetLossThreshold;
    this.MIN_DEGRADE_GRACE_PERIOD = storeParams.degradeGracePeriodSeconds;
    this.MIN_RECOVER_GRACE_PERIOD = storeParams.recoverGracePeriodSeconds;

    this.degradeGracePeriod = this.MIN_DEGRADE_GRACE_PERIOD;
    this.recoverGracePeriod = this.MIN_RECOVER_GRACE_PERIOD;
  }

  handleRtcStatsChange(packetsLost: number) {
    /**
     * packetLost is a running counter
     * Degrade if packetsLost increase is greater than threshold
     */
    const shouldDegrade = packetsLost > this.packetsLost + this.PACKETS_LOST_THRESHOLD;
    this.packetsLost = packetsLost;
    shouldDegrade ? this.degrade() : this.recover();
  }

  degrade() {
    if (this.degradeGracePeriod > 0) {
      this.degradeGracePeriod--;
      return;
    }

    if (this.isAttemptingRecover) {
      return this.cancelRecovery();
    }

    HMSLogger.d(this.TAG, 'Packet loss increased, Degrading', { packetsLost: this.packetsLost });

    this.degradeActiveTracksByHalf();

    this.degradeGracePeriod = this.MIN_DEGRADE_GRACE_PERIOD;
    this.recoverGracePeriod = this.MIN_RECOVER_GRACE_PERIOD;
  }

  recover() {
    this.degradeGracePeriod = this.MIN_DEGRADE_GRACE_PERIOD;
    if (this.recoverGracePeriod > 0) {
      this.recoverGracePeriod--;
      return;
    }

    this.recoveringTrack = this.getActiveTracks(true).find(track => track.degraded);
    if (!this.recoveringTrack) {
      return;
    }

    HMSLogger.d(this.TAG, 'Packet lost stable, recovering track', this.recoveringTrack);
    this.recoveringTrack.setDegradedFromSdk(false);
    this.eventBus.trackRestored.publish(this.recoveringTrack);
    this.recoverGracePeriod = this.MIN_RECOVER_GRACE_PERIOD;
  }

  cleanUp() {
    this.eventBus.trackDegraded.removeAllListeners();
    this.eventBus.trackRestored.removeAllListeners();
  }

  private degradeActiveTracksByHalf() {
    const activeTracks = this.getActiveTracks(false);
    if (!activeTracks.length) {
      return;
    }
    HMSLogger.d(this.TAG, { activeTracks: [...activeTracks] });

    let halfCount = Math.ceil(activeTracks.length / 2);
    while (halfCount--) {
      const track = activeTracks.pop();
      track!.setDegradedFromSdk(true);
      this.eventBus.trackDegraded.publish(track!);
    }
  }

  private getActiveTracks(includeDegraded: boolean) {
    return this.store
      .getRemoteVideoTracks()
      .filter(track => track.hasSinks() && (!track.degraded || includeDegraded))
      .sort((trackA, trackB) => {
        const comparators = this.store.getComparator().getTrackComparators();
        /**
         * Sort in descending order of importance.
         * Importance: Screenshare > Role Priority > Speaker > TrackId
         */
        return (
          -1 *
          (comparators.screenShare(trackA, trackB) ||
            comparators.rolePriority(trackA, trackB) ||
            comparators.peerAudioLevel(trackA, trackB) ||
            this.store.getComparator().stringComparator(trackA.trackId, trackB.trackId))
        );
      })
      .slice(0); // Shallow copy - clone array, keep track references
  }

  private cancelRecovery() {
    if (this.recoveringTrack) {
      this.recoveringTrack.setDegradedFromSdk(true);
      this.eventBus.trackDegraded.publish(this.recoveringTrack);
    }
    this.recoveringTrack = undefined;
    this.recoverAttemptCount++;
    this.recoverGracePeriod = this.getDelayForRecoverCount(this.recoverAttemptCount);
    this.degradeGracePeriod = this.MIN_DEGRADE_GRACE_PERIOD;
    HMSLogger.d(this.TAG, 'Recover Attempt Failed', {
      count: this.recoverAttemptCount,
      delay: this.recoverGracePeriod,
    });
  }

  private getDelayForRecoverCount(count: number) {
    const delay = this.MIN_RECOVER_GRACE_PERIOD + this.MIN_RECOVER_GRACE_PERIOD * count;
    return Math.min(delay, this.MAX_RECOVER_GRACE_PERIOD);
  }
}
