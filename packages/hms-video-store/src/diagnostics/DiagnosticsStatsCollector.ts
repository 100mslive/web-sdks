import { DiagnosticsRTCStatsReport } from '.';
import { HMSPeerStats, HMSTrackStats } from '../interfaces';
import { HMSWebrtcStats } from '../rtc-stats';
import { computeBitrate } from '../rtc-stats/utils';
import { HMSSdk } from '../sdk';

const isValidNumber = (num: number | undefined): boolean => !!num && !isNaN(num);
const getLastElement = <T>(arr: T[]): T | undefined => arr[arr.length - 1];
const calculateAverage = <T>(arr: T[], predicate: (val: T) => number | undefined): number => {
  const filteredArr = arr.filter(curr => isValidNumber(predicate(curr)));
  return filteredArr.reduce((acc, curr) => acc + (predicate(curr) || 0), 0) / filteredArr.length;
};

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

    const localAudioTrackID = this.sdk.getLocalPeer()?.audioTrack?.nativeTrack?.id;
    const localVideoTrackID = this.sdk.getLocalPeer()?.videoTrack?.nativeTrack?.id;

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

    const ridAveragedAudioBitrateList = this.localAudioTrackStatsList.map(trackStatsMap =>
      trackStatsMap ? calculateAverage(Object.values(trackStatsMap), curr => curr.bitrate) : 0,
    );

    const ridAveragedVideoBitrateList = this.localVideoTrackStatsList.map(trackStatsMap =>
      trackStatsMap ? calculateAverage(Object.values(trackStatsMap), curr => curr.bitrate) : 0,
    );
    const audioJitter = getLastElement(this.remoteAudioTrackStatsList)?.jitter || 0;
    const videoJitter = getLastElement(this.remoteVideoTrackStatsList)?.jitter || 0;
    const jitter = Math.max(audioJitter, videoJitter);
    const lastLocalAudioTrackStats = getLastElement(this.localAudioTrackStatsList);
    const lastLocalVideoTrackStats = getLastElement(this.localVideoTrackStatsList);

    return {
      combined: {
        roundTripTime,
        packetsReceived: audioPacketsReceived + videoPacketsReceived,
        packetsLost: lastSubscribeStats?.packetsLost || 0,
        bytesSent: lastPublishStats?.bytesSent || 0,
        bytesReceived: lastSubscribeStats?.bytesReceived || 0,
        bitrateSent: calculateAverage(this.peerStatsList, curr => curr.publish?.bitrate),
        bitrateReceived: calculateAverage(this.peerStatsList, curr => curr.subscribe?.bitrate),
        jitter: jitter,
      },
      audio: {
        roundTripTime,
        packetsReceived: audioPacketsReceived,
        packetsLost: getLastElement(this.remoteAudioTrackStatsList)?.packetsLost || 0,
        bytesReceived: getLastElement(this.remoteAudioTrackStatsList)?.bytesReceived || 0,
        bitrateSent: calculateAverage(ridAveragedAudioBitrateList, curr => curr),
        bitrateReceived: calculateAverage(this.remoteAudioTrackStatsList, curr => curr.bitrate),
        bytesSent: lastLocalAudioTrackStats
          ? Object.values(lastLocalAudioTrackStats).reduce((acc, curr) => acc + (curr.bytesSent || 0), 0)
          : 0,
        jitter: audioJitter,
      },
      video: {
        roundTripTime,
        packetsLost: getLastElement(this.remoteVideoTrackStatsList)?.packetsLost || 0,
        bytesReceived: getLastElement(this.remoteVideoTrackStatsList)?.bytesReceived || 0,
        packetsReceived: videoPacketsReceived,
        bitrateSent: calculateAverage(ridAveragedVideoBitrateList, curr => curr),
        bitrateReceived: calculateAverage(this.remoteVideoTrackStatsList, curr => curr.bitrate),
        bytesSent: lastLocalVideoTrackStats
          ? Object.values(lastLocalVideoTrackStats).reduce((acc, curr) => acc + (curr.bytesSent || 0), 0)
          : 0,
        jitter: videoJitter,
      },
    };
  }
}
