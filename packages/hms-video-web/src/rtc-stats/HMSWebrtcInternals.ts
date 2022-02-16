import { EventBus } from '../events/EventBus';
import { HMSWebrtcStats } from './HMSWebrtcStats';
import { IStore } from '../sdk/store';
import HMSLogger from '../utils/logger';
import { RTC_STATS_MONITOR_INTERVAL } from '../utils/constants';
import { sleep } from '../utils/timer-utils';

export class HMSWebrtcInternals {
  private readonly TAG = '[HMSWebrtcInternals]';
  private readonly interval = RTC_STATS_MONITOR_INTERVAL;
  private isMonitored = false;
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
    await this.hmsStats?.updateStats();
    this.eventBus.statsUpdate.publish(this.hmsStats);
  };

  /**
   *
   * @internal
   */
  setPeerConnections({ publish, subscribe }: { publish?: RTCPeerConnection; subscribe?: RTCPeerConnection }) {
    this.publishConnection = publish;
    this.subscribeConnection = subscribe;

    this.hmsStats = new HMSWebrtcStats(
      {
        publish: this.publishConnection?.getStats.bind(this.publishConnection),
        subscribe: this.subscribeConnection?.getStats.bind(this.subscribeConnection),
      },
      this.store,
    );
  }

  /**
   * @internal
   */
  async start() {
    this.stop();
    this.isMonitored = true;
    HMSLogger.d(this.TAG, 'Starting Webrtc Stats Monitor');
    this.startLoop()
      .then(() => HMSLogger.d(this.TAG, 'Stopping Webrtc Stats Monitor'))
      .catch(e => HMSLogger.e(this.TAG, e.message));
  }

  private stop() {
    this.isMonitored = false;
  }

  private async startLoop() {
    while (this.isMonitored) {
      await this.handleStatsUpdate();
      await sleep(this.interval);
    }
  }

  /**
   * @internal
   */
  cleanUp() {
    this.stop();
    this.eventBus.statsUpdate.removeAllListeners();
  }
}
