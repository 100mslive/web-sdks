import { HMSInternalEvent } from '../events/HMSInternalEvent';
import { PeerConnectionType } from '../transport/ITransport';
import { RTC_STATS_MONITOR_INTERVAL } from '../utils/constants';
import HMSLogger from '../utils/logger';
import { sleep } from '../utils/timer-utils';

export type RTCStatsUpdate = Record<Partial<PeerConnectionType>, RTCStatsReport>;

export class RTCStatsMonitor {
  private isMonitored: boolean = false;
  constructor(
    private readonly hmsInternalEvent: HMSInternalEvent<RTCStatsUpdate>,
    private readonly connections: Record<Partial<PeerConnectionType>, RTCPeerConnection>,
    private readonly interval = RTC_STATS_MONITOR_INTERVAL,
  ) {}

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
    const stats: Record<string, RTCStatsReport> = {};
    for (const connType in this.connections) {
      const conn = this.connections[connType as PeerConnectionType];
      stats[connType] = await conn.getStats();
    }

    this.hmsInternalEvent.publish(stats as RTCStatsUpdate);
  }
}
