import { HMSWebrtcStats } from './HMSWebrtcStats';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { EventBus } from '../events/EventBus';
import { Store } from '../sdk/store';
import { RTC_STATS_MONITOR_INTERVAL } from '../utils/constants';
import HMSLogger from '../utils/logger';
import { sleep } from '../utils/timer-utils';

export class HMSWebrtcInternals {
  private readonly TAG = '[HMSWebrtcInternals]';
  private readonly interval = RTC_STATS_MONITOR_INTERVAL;
  private isMonitored = false;
  private hmsStats?: HMSWebrtcStats;

  constructor(private readonly store: Store, private readonly eventBus: EventBus) {}

  getCurrentStats() {
    return this.hmsStats;
  }

  getPublishPeerConnection() {
    return this.hmsStats?.getPublishPeerConnection();
  }

  getSubscribePeerConnection() {
    return this.hmsStats?.getSubscribePeerConnection();
  }

  onStatsChange(statsChangeCb: (stats: HMSWebrtcStats) => void) {
    this.eventBus.statsUpdate.subscribe(statsChangeCb);
    return () => {
      this.eventBus.statsUpdate.unsubscribe(statsChangeCb);
    };
  }

  private handleStatsUpdate = async () => {
    await this.hmsStats?.updateStats();
    if (this.hmsStats) {
      this.eventBus.statsUpdate.publish(this.hmsStats);
    }
  };

  /**
   *
   * @internal
   */
  setPeerConnections({ publish, subscribe }: { publish?: RTCPeerConnection; subscribe?: RTCPeerConnection }) {
    if (this.hmsStats) {
      this.hmsStats.setPeerConnections({ publish, subscribe });
    } else {
      this.hmsStats = new HMSWebrtcStats(this.store, this.eventBus, publish, subscribe);
    }
  }

  /**
   * @internal
   */
  async start() {
    if (this.isMonitored) {
      HMSLogger.d(this.TAG, 'Already started');
      return;
    }
    this.stop();
    this.isMonitored = true;
    HMSLogger.d(this.TAG, 'Starting Webrtc Stats Monitor');
    this.startLoop()
      .then(() => HMSLogger.d(this.TAG, 'Stopping Webrtc Stats Monitor'))
      .catch(e => {
        this.eventBus.analytics.publish(
          AnalyticsEventFactory.rtcStatsFailed(ErrorFactory.WebrtcErrors.StatsFailed(HMSAction.PUBLISH, e.message)),
        );
        HMSLogger.e(this.TAG, e.message);
      });
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
  cleanup() {
    this.stop();
    this.eventBus.statsUpdate.removeAllListeners();
  }
}
