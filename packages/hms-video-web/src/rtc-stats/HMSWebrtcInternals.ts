import { RTCStatsMonitor } from './RTCStatsMonitor';
import { EventBus } from '../events/EventBus';
import { HMSWebrtcStats } from './HMSWebrtcStats';
import { IStore } from '../sdk/store';

export class HMSWebrtcInternals {
  private statsMonitor?: RTCStatsMonitor;
  private hmsStats?: HMSWebrtcStats;

  constructor(
    private readonly store: IStore,
    private readonly eventBus: EventBus,
    private publishConnection?: RTCPeerConnection,
    private subscribeConnection?: RTCPeerConnection,
  ) {}

  getPublishPeerConnection() {
    return this.publishConnection;
  }

  getSubscribePeerConnection() {
    return this.subscribeConnection;
  }

  onStatsChange(statsChangeCb: (stats: HMSWebrtcStats) => void) {
    this.eventBus.statsUpdate.subscribe(statsChangeCb);
    return () => {
      this.eventBus.statsUpdate.unsubscribe(statsChangeCb);
    };
  }

  private handleStatsUpdate = async () => {
    await this.hmsStats?.updateStats(this.hmsStats);
    this.eventBus.statsUpdate.publish(this.hmsStats);
  };

  /**
   * @internal
   */
  getStatsMonitor() {
    return this.statsMonitor;
  }

  /**
   *
   * @internal
   */
  setPeerConnections({ publish, subscribe }: { publish?: RTCPeerConnection; subscribe?: RTCPeerConnection }) {
    this.publishConnection = publish;
    this.subscribeConnection = subscribe;

    this.statsMonitor = new RTCStatsMonitor(
      this.eventBus.rtcStatsUpdate,
      Object.assign(
        {},
        this.publishConnection && { publish: this.publishConnection },
        this.subscribeConnection && { subscribe: this.subscribeConnection },
      ),
    );
    this.hmsStats = new HMSWebrtcStats(
      {
        publish: this.publishConnection?.getStats.bind(this.publishConnection),
        subscribe: this.subscribeConnection?.getStats.bind(this.subscribeConnection),
      },
      this.store,
    );
    this.eventBus.rtcStatsUpdate.subscribe(this.handleStatsUpdate);
  }

  /**
   * @internal
   */
  cleanUp() {
    this.statsMonitor?.stop();
    this.eventBus.rtcStatsUpdate.removeAllListeners();
    this.eventBus.statsUpdate.removeAllListeners();
  }
}
