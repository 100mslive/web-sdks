import HMSConnection from '../connection';
import { RTC_STATS_MONITOR_INTERVAL } from '../utils/constants';
import HMSLogger from '../utils/logger';
import { sleep } from '../utils/timer-utils';
import { TypedEventEmitter } from '../utils/typed-event-emitter';
import { RTCStats } from './RTCStats';

export class RTCStatsMonitor extends TypedEventEmitter<{ RTC_STATS_CHANGE: RTCStats }> {
  private isMonitored: boolean = false;
  constructor(private readonly connections: HMSConnection[], private readonly interval = RTC_STATS_MONITOR_INTERVAL) {
    super();
  }

  async start() {
    this.stop();
    this.isMonitored = true;
    HMSLogger.d('Starting RTCStatsMonitor');
    this.startLoop().then(() => HMSLogger.d('Stopping RTCStatsMonitor'));
  }

  stop() {
    this.isMonitored = false;
  }

  private async startLoop() {
    while (this.isMonitored) {
      await this.handleConnectionsStats();
      await sleep(this.interval);
    }
  }

  private async handleConnectionsStats() {
    let totalPacketsLost = 0;
    let availableIncomingBitrate = 0;
    let availableOutgoingBitrate = 0;
    for (const conn of this.connections) {
      const stats = await conn.getStats();
      stats.forEach(stat => {
        if (stat.packetsLost) totalPacketsLost += stat.packetsLost;
        if (stat.availableIncomingBitrate) availableIncomingBitrate = Number(stat.availableIncomingBitrate);
        if (stat.availableOutgoingBitrate) availableOutgoingBitrate = Number(stat.availableOutgoingBitrate);
      });
    }

    this.emit('RTC_STATS_CHANGE', {
      packetsLost: totalPacketsLost,
      availableIncomingBitrate,
      availableOutgoingBitrate,
    });
  }
}
