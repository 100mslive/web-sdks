import { DiagnosticsRTCStatsReport } from '.';
import { HMSPeerStats, HMSTrackStats } from '../interfaces';
import { HMSWebrtcStats } from '../rtc-stats';
import { computeBitrate } from '../rtc-stats/utils';
import { HMSSdk } from '../sdk';

const isValidNumber = (num: number | undefined): boolean => !!num && !isNaN(num);
const getLastElement = <T>(arr: T[]): T | undefined => arr[arr.length - 1];

export class DiagnosticsStatsCollector {
  private peerStatsList: HMSPeerStats[] = [];
  private localAudioTrackStatsList: Record<string, HMSTrackStats>[] = [];
  private localVideoTrackStatsList: Record<string, HMSTrackStats>[] = [];
  private remoteAudioTrackStatsList: HMSTrackStats[] = [];
  private remoteVideoTrackStatsList: HMSTrackStats[] = [];

  constructor(private sdk: HMSSdk) {}

  async handleStatsUpdate(stats: HMSWebrtcStats) {
    const localPeerStats = stats.getLocalPeerStats();
    if (localPeerStats) {
      this.peerStatsList.push(localPeerStats);
    }

    const localAudioTrackID = this.sdk.getLocalPeer()?.audioTrack?.trackId;
    const localVideoTrackID = this.sdk.getLocalPeer()?.videoTrack?.trackId;

    const localTrackStats = stats.getLocalTrackStats();
    if (localTrackStats) {
      localAudioTrackID && this.localAudioTrackStatsList.push(localTrackStats[localAudioTrackID]);
      localVideoTrackID && this.localVideoTrackStatsList.push(localTrackStats[localVideoTrackID]);
    }

    const subscribeStatsReport = await this.sdk.getWebrtcInternals()?.getSubscribePeerConnection()?.getStats();
    subscribeStatsReport?.forEach(stat => {
      if (stat.type === 'inbound-rtp') {
        const list = stat.kind === 'audio' ? this.remoteAudioTrackStatsList : this.remoteVideoTrackStatsList;
        const bitrate = computeBitrate('bytesReceived', stat, getLastElement(list));
        list.push({ ...stat, bitrate });
      }
    });
  }

  // eslint-disable-next-line complexity
  buildReport(): DiagnosticsRTCStatsReport {
    const lastPublishStats = getLastElement(this.peerStatsList)?.publish;
    const lastSubscribeStats = getLastElement(this.peerStatsList)?.subscribe;
    const publishRoundTripTime = lastPublishStats?.responsesReceived
      ? (lastPublishStats?.totalRoundTripTime || 0) / lastPublishStats.responsesReceived
      : 0;
    const subscribeRoundTripTime = lastSubscribeStats?.responsesReceived
      ? (lastSubscribeStats?.totalRoundTripTime || 0) / lastSubscribeStats.responsesReceived
      : 0;
    const roundTripTime = Number((((publishRoundTripTime + subscribeRoundTripTime) / 2) * 1000).toFixed(2));

    const audioPacketsReceived = getLastElement(this.remoteAudioTrackStatsList)?.packetsReceived || 0;
    const videoPacketsReceived = getLastElement(this.remoteVideoTrackStatsList)?.packetsReceived || 0;

    const ridAveragedAudioBitrateList = this.localAudioTrackStatsList
      .map(
        trackStatsMap =>
          Object.values(trackStatsMap).reduce((acc, curr) => acc + (curr.bitrate || 0), 0) /
          Object.values(trackStatsMap).filter(curr => isValidNumber(curr.bitrate)).length,
      )
      .filter(isValidNumber);

    const ridAveragedVideoBitrateList = this.localVideoTrackStatsList
      .map(
        trackStatsMap =>
          Object.values(trackStatsMap).reduce((acc, curr) => acc + (curr.bitrate || 0), 0) /
          Object.values(trackStatsMap).filter(curr => isValidNumber(curr.bitrate)).length,
      )
      .filter(isValidNumber);

    const lastLocalAudioTrackStats = getLastElement(this.localAudioTrackStatsList);
    const lastLocalVideoTrackStats = getLastElement(this.localVideoTrackStatsList);

    return {
      combined: {
        roundTripTime,
        packetsReceived: audioPacketsReceived + videoPacketsReceived,
        packetsLost: lastSubscribeStats?.packetsLost || 0,
        bytesSent: lastPublishStats?.bytesSent || 0,
        bytesReceived: lastSubscribeStats?.bytesReceived || 0,
        bitrateSent:
          this.peerStatsList.reduce((acc, curr) => acc + (curr.publish?.bitrate || 0), 0) /
          this.peerStatsList.filter(curr => isValidNumber(curr.publish?.bitrate)).length,
        bitrateReceived:
          this.peerStatsList.reduce((acc, curr) => acc + (curr.subscribe?.bitrate || 0), 0) /
          this.peerStatsList.filter(curr => isValidNumber(curr.subscribe?.bitrate)).length,
      },
      audio: {
        roundTripTime,
        packetsReceived: audioPacketsReceived,
        packetsLost: getLastElement(this.remoteAudioTrackStatsList)?.packetsLost || 0,
        bytesReceived: getLastElement(this.remoteAudioTrackStatsList)?.bytesReceived || 0,
        bitrateSent:
          ridAveragedAudioBitrateList.reduce((acc, curr) => acc + curr, 0) / ridAveragedAudioBitrateList.length,
        bitrateReceived:
          this.remoteAudioTrackStatsList.reduce((acc, curr) => acc + (curr.bitrate || 0), 0) /
          this.remoteAudioTrackStatsList.filter(curr => isValidNumber(curr.bitrate)).length,
        bytesSent: lastLocalAudioTrackStats
          ? Object.values(lastLocalAudioTrackStats).reduce((acc, curr) => acc + (curr.bytesSent || 0), 0)
          : 0,
      },
      video: {
        roundTripTime,
        packetsLost: getLastElement(this.remoteVideoTrackStatsList)?.packetsLost || 0,
        bytesReceived: getLastElement(this.remoteVideoTrackStatsList)?.bytesReceived || 0,
        packetsReceived: videoPacketsReceived,
        bitrateSent:
          ridAveragedVideoBitrateList.reduce((acc, curr) => acc + curr, 0) / ridAveragedVideoBitrateList.length,
        bitrateReceived:
          this.remoteVideoTrackStatsList.reduce((acc, curr) => acc + (curr.bitrate || 0), 0) /
          this.remoteVideoTrackStatsList.filter(curr => isValidNumber(curr.bitrate)).length,
        bytesSent: lastLocalVideoTrackStats
          ? Object.values(lastLocalVideoTrackStats).reduce((acc, curr) => acc + (curr.bytesSent || 0), 0)
          : 0,
      },
    };
  }
}
