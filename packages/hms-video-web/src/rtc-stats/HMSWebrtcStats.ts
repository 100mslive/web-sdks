import {
  computeNumberRate,
  getLocalPeerStatsFromReport,
  getLocalTrackStats,
  getPacketsLostAndJitterFromReport,
  getTrackStats,
  union,
} from './utils';
import { HMSPeerStats, HMSTrackStats, PeerConnectionType } from '../interfaces/webrtc-stats';
import { HMSLocalTrack, HMSRemoteAudioTrack, HMSRemoteTrack, HMSRemoteVideoTrack } from '../media/tracks';
import { IStore } from '../sdk/store';
import HMSLogger from '../utils/logger';

export class HMSWebrtcStats {
  private readonly TAG = '[HMSWebrtcStats]';
  private localPeerID?: string;
  private peerStats: Record<string, HMSPeerStats> = {};
  private remoteTrackStats: Record<string, HMSTrackStats> = {};
  private localTrackStats: Record<string, Record<string, HMSTrackStats>> = {};

  /**
   * Removed localPeerID check in other places as it will be present before
   * this is initialized
   */
  constructor(
    private getStats: Record<PeerConnectionType, RTCPeerConnection['getStats'] | undefined>,
    private store: IStore,
  ) {
    this.localPeerID = this.store.getLocalPeer()?.peerId;
  }

  getLocalPeerStats = (): HMSPeerStats | undefined => {
    return this.peerStats[this.localPeerID!];
  };

  getRemoteTrackStats = (trackId: string): HMSTrackStats | undefined => {
    return this.remoteTrackStats[trackId];
  };

  getLocalTrackStats = () => {
    return this.localTrackStats;
  };

  /**
   * @internal
   */
  updateStats = async () => {
    await this.updateLocalPeerStats();
    await this.updateLocalTrackStats();
    await this.updateRemoteTrackStats();
  };

  private updateLocalPeerStats = async () => {
    const prevLocalPeerStats = this.getLocalPeerStats();
    let publishReport: RTCStatsReport | undefined;
    try {
      publishReport = await this.getStats.publish?.();
    } catch (err) {
      HMSLogger.w(this.TAG, 'Error in getting publish stats', err);
    }
    const publishStats: HMSPeerStats['publish'] | undefined =
      publishReport && getLocalPeerStatsFromReport('publish', publishReport, prevLocalPeerStats);

    let subscribeReport: RTCStatsReport | undefined;
    try {
      subscribeReport = await this.getStats.subscribe?.();
    } catch (err) {
      HMSLogger.w(this.TAG, 'Error in getting subscribe stats', err);
    }
    const baseSubscribeStats =
      subscribeReport && getLocalPeerStatsFromReport('subscribe', subscribeReport, prevLocalPeerStats);
    const { packetsLost, jitter } = getPacketsLostAndJitterFromReport(subscribeReport);
    const packetsLostRate = computeNumberRate(
      packetsLost,
      prevLocalPeerStats?.subscribe?.packetsLost,
      baseSubscribeStats?.timestamp,
      prevLocalPeerStats?.subscribe?.timestamp,
    );

    const subscribeStats: HMSPeerStats['subscribe'] =
      baseSubscribeStats && Object.assign(baseSubscribeStats, { packetsLostRate, jitter, packetsLost });

    this.peerStats[this.localPeerID!] = { publish: publishStats, subscribe: subscribeStats };
  };

  private updateRemoteTrackStats = async () => {
    const tracks = Array.from(this.store.getTracksMap().values()).filter(
      track => track instanceof HMSRemoteVideoTrack || track instanceof HMSRemoteAudioTrack,
    );
    const trackIds = tracks.map(track => track.trackId);
    Object.keys(this.remoteTrackStats).forEach(trackId => {
      if (!trackIds.includes(trackId)) {
        delete this.remoteTrackStats[trackId];
      }
    });
    for (const track of tracks) {
      const peerName = track.peerId && this.store.getPeerById(track.peerId)?.name;
      const prevTrackStats = this.getRemoteTrackStats(track.trackId);
      const trackStats = await getTrackStats(track as HMSRemoteTrack, peerName, prevTrackStats);
      if (trackStats) {
        this.remoteTrackStats[track.trackId] = trackStats;
      }
    }
  };

  private updateLocalTrackStats = async () => {
    const tracks = this.store.getLocalPeerTracks().reduce<Record<string, HMSLocalTrack>>((res, track) => {
      res[track.getTrackIDBeingSent()] = track;
      return res;
    }, {});
    const trackIDs = union(Object.keys(this.localTrackStats), Object.keys(tracks));
    for (const trackID of trackIDs) {
      const track = tracks[trackID] as HMSLocalTrack;
      if (track) {
        const peerName = this.store.getLocalPeer()?.name;
        const trackStats = await getLocalTrackStats(track, peerName, this.localTrackStats[trackID]);
        if (trackStats) {
          this.localTrackStats[trackID] = trackStats;
        }
      } else {
        delete this.localTrackStats[trackID];
      }
    }
  };
}
