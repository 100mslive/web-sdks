import { DiagnosticsRTCStatsReport } from '.';
import { HMSPeerStats, HMSTrackStats } from '../interfaces';
import { HMSTrackType } from '../internal';
import { HMSWebrtcStats } from '../rtc-stats';
import { HMSSdk } from '../sdk';

export class DiagnosticsStatsCollector {
  private peerStatsList: HMSPeerStats[] = [];
  private localAudioTrackStatsList: Record<string, HMSTrackStats>[] = [];
  private localVideoTrackStatsList: Record<string, HMSTrackStats>[] = [];
  private remoteAudioTrackStatsList: HMSTrackStats[] = [];
  private remoteVideoTrackStatsList: HMSTrackStats[] = [];

  constructor(private sdk: HMSSdk) {}

  handleStatsUpdate(stats: HMSWebrtcStats): void {
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

    const remoteTrackStats = stats.getAllRemoteTracksStats();
    Object.values(remoteTrackStats).forEach(trackStats => {
      if (trackStats.kind === HMSTrackType.AUDIO) {
        this.remoteAudioTrackStatsList.push(trackStats);
      } else {
        this.remoteVideoTrackStatsList.push(trackStats);
      }
    });
  }

  // eslint-disable-next-line complexity
  buildReport(): DiagnosticsRTCStatsReport {
    const publishRoundTripTime = this.peerStatsList[this.peerStatsList.length - 1].publish?.totalRoundTripTime || 0;
    const subscribeRoundTripTime = this.peerStatsList[this.peerStatsList.length - 1].subscribe?.totalRoundTripTime || 0;
    const roundTripTime = (publishRoundTripTime + subscribeRoundTripTime) / 2;

    const audioPacketsReceived = this.remoteAudioTrackStatsList.reduce(
      (acc, curr) => acc + (curr.packetsReceived || 0),
      0,
    );

    const videoPacketsReceived = this.remoteVideoTrackStatsList.reduce(
      (acc, curr) => acc + (curr.packetsReceived || 0),
      0,
    );

    return {
      combined: {
        bytesSent: this.peerStatsList[this.peerStatsList.length - 1].publish?.bytesSent || 0,
        bytesReceived: this.peerStatsList[this.peerStatsList.length - 1].subscribe?.bytesSent || 0,
        bitrateSent:
          this.peerStatsList.reduce((acc, curr) => acc + (curr.publish?.bitrate || 0), 0) / this.peerStatsList.length,
        bitrateReceived:
          this.peerStatsList.reduce((acc, curr) => acc + (curr.subscribe?.bitrate || 0), 0) / this.peerStatsList.length,
        packetsLost: this.peerStatsList[this.peerStatsList.length - 1].subscribe?.packetsLost || 0,
        packetsReceived: audioPacketsReceived + videoPacketsReceived,
        roundTripTime,
      },
      audio: {
        bytesSent: this.localAudioTrackStatsList.reduce(
          (acc, curr) => acc + Object.values(curr).reduce((acc, curr) => acc + (curr.bytesSent || 0), 0),
          0,
        ),
        bytesReceived: this.remoteAudioTrackStatsList.reduce((acc, curr) => acc + (curr.bytesReceived || 0), 0),
        bitrateSent:
          this.localAudioTrackStatsList.reduce(
            (acc, curr) =>
              acc + Object.values(curr).reduce((acc, curr) => acc + (curr.bitrate || 0) / Object.keys(curr).length, 0),
            0,
          ) / this.localAudioTrackStatsList.length,

        bitrateReceived:
          this.remoteAudioTrackStatsList.reduce((acc, curr) => acc + (curr.bitrate || 0), 0) /
          this.remoteAudioTrackStatsList.length,
        packetsReceived: audioPacketsReceived,
        packetsLost: this.remoteAudioTrackStatsList.reduce((acc, curr) => acc + (curr.packetsLost || 0), 0),
        roundTripTime,
      },
      video: {
        bytesSent: this.localVideoTrackStatsList.reduce(
          (acc, curr) => acc + Object.values(curr).reduce((acc, curr) => acc + (curr.bytesSent || 0), 0),
          0,
        ),
        bytesReceived: this.remoteVideoTrackStatsList.reduce((acc, curr) => acc + (curr.bytesReceived || 0), 0),
        bitrateSent:
          this.localVideoTrackStatsList.reduce(
            (acc, curr) =>
              acc + Object.values(curr).reduce((acc, curr) => acc + (curr.bitrate || 0) / Object.keys(curr).length, 0),
            0,
          ) / this.localVideoTrackStatsList.length,

        bitrateReceived:
          this.remoteVideoTrackStatsList.reduce((acc, curr) => acc + (curr.bitrate || 0), 0) /
          this.remoteVideoTrackStatsList.length,
        packetsReceived: videoPacketsReceived,
        packetsLost: this.remoteVideoTrackStatsList.reduce((acc, curr) => acc + (curr.packetsLost || 0), 0),
        roundTripTime,
      },
    };
  }
}
