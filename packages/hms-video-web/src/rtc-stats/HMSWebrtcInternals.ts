import { RTCStatsMonitor } from './RTCStatsMonitor';
import { EventBus } from '../events/EventBus';
import { PeerConnectionType } from '../transport/ITransport';
import { HMSWebrtcStats } from './HMSWebrtcStats';

export class HMSWebrtcInternals {
  private statsMonitor: RTCStatsMonitor;
  private currentHmsStats?: HMSWebrtcStats;

  constructor(
    private readonly eventBus: EventBus,
    private readonly publishConnection?: RTCPeerConnection,
    private readonly subscribeConnection?: RTCPeerConnection,
  ) {
    this.statsMonitor = new RTCStatsMonitor(
      this.eventBus.rtcStatsUpdate,
      Object.assign(
        {},
        this.publishConnection && { publish: this.publishConnection },
        this.subscribeConnection && { subscribe: this.subscribeConnection },
      ),
    );
    this.eventBus.rtcStatsUpdate.subscribe(this.handleStatsUpdate);
  }

  getPublishPeerConnection() {
    return this.publishConnection;
  }

  getSubscribePeerConnection() {
    return this.subscribeConnection;
  }

  getHMSStats() {
    return this.currentHmsStats;
  }

  onStatsChange(statsChangeCb: (stats: HMSWebrtcStats) => void) {
    this.eventBus.statsUpdate.subscribe(statsChangeCb);
    return () => {
      this.eventBus.statsUpdate.unsubscribe(statsChangeCb);
    };
  }

  private handleStatsUpdate = (stats: Record<PeerConnectionType, RTCStatsReport>) => {
    /**
     * @TODO send prevStats when creating new HMSWebrtcStats to calculate bitrate based on delta
     */
    this.currentHmsStats = new HMSWebrtcStats(stats);
    this.eventBus.statsUpdate.publish(this.currentHmsStats);
  };

  /**
   * @internal
   */
  getStatsMonitor() {
    return this.statsMonitor;
  }

  /**
   * @internal
   */
  cleanUp() {
    this.statsMonitor.stop();
    this.eventBus.rtcStatsUpdate.removeAllListeners();
    this.eventBus.statsUpdate.removeAllListeners();
  }
}
