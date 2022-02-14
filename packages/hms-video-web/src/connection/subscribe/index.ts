import HMSConnection from '../index';
import { ISignal } from '../../signal/ISignal';
import ISubscribeConnectionObserver from './ISubscribeConnectionObserver';
import { HMSConnectionRole } from '../model';
import HMSRemoteStream from '../../media/streams/HMSRemoteStream';
import HMSDataChannel from '../HMSDataChannel';
import { API_DATA_CHANNEL } from '../../utils/constants';
import { HMSRemoteAudioTrack } from '../../media/tracks/HMSRemoteAudioTrack';
import { HMSRemoteVideoTrack } from '../../media/tracks/HMSRemoteVideoTrack';
import HMSLogger from '../../utils/logger';
import { getSdpTrackIdForMid } from '../../utils/session-description';

export default class HMSSubscribeConnection extends HMSConnection {
  private readonly TAG = '[HMSSubscribeConnection]';
  private readonly remoteStreams = new Map<string, HMSRemoteStream>();

  private readonly observer: ISubscribeConnectionObserver;
  public readonly serverSubDegrade: boolean;

  readonly nativeConnection: RTCPeerConnection;

  private pendingMessageQueue: string[] = [];

  private apiChannel?: HMSDataChannel;

  private initNativeConnectionCallbacks() {
    this.nativeConnection.oniceconnectionstatechange = () => {
      this.observer.onIceConnectionChange(this.nativeConnection.iceConnectionState);
    };

    // @TODO(eswar): Remove this. Use iceconnectionstate change with interval and threshold.
    this.nativeConnection.onconnectionstatechange = () => {
      this.observer.onConnectionStateChange(this.nativeConnection.connectionState);
    };

    this.nativeConnection.ondatachannel = e => {
      if (e.channel.label !== API_DATA_CHANNEL) {
        // TODO: this.observer.onDataChannel(e.channel);
        return;
      }

      this.apiChannel = new HMSDataChannel(
        e.channel,
        {
          onMessage: (value: string) => {
            this.observer.onApiChannelMessage(value);
          },
        },
        `role=${this.role}`,
      );

      e.channel.onopen = this.handlePendingApiMessages;
    };

    this.nativeConnection.onicecandidate = e => {
      if (e.candidate !== null) {
        this.signal.trickle(this.role, e.candidate);
      }
    };

    this.nativeConnection.ontrack = e => {
      const stream = e.streams[0];
      const streamId = stream.id;
      if (!this.remoteStreams.has(streamId)) {
        const remote = new HMSRemoteStream(stream, this);
        this.remoteStreams.set(streamId, remote);

        stream.onremovetrack = e => {
          /*
           * this match has to be with nativetrack.id instead of track.trackId as the latter refers to sdp track id for
           * ease of correlating update messages coming from the backend. The two track ids are usually the same, but
           * can be different for some browsers. checkout sdptrackid field in HMSTrack for more details.
           */
          const toRemoveTrackIdx = remote.tracks.findIndex(track => track.nativeTrack.id === e.track.id);
          if (toRemoveTrackIdx >= 0) {
            const toRemoveTrack = remote.tracks[toRemoveTrackIdx];
            this.observer.onTrackRemove(toRemoveTrack);
            remote.tracks.splice(toRemoveTrackIdx, 1);

            // If the length becomes 0 we assume that stream is removed entirely
            if (remote.tracks.length === 0) {
              this.remoteStreams.delete(streamId);
            }
          }
        };
      }

      const remote = this.remoteStreams.get(streamId)!;
      const TrackCls = e.track.kind === 'audio' ? HMSRemoteAudioTrack : HMSRemoteVideoTrack;
      const track = new TrackCls(remote, e.track);
      const trackId = getSdpTrackIdForMid(this.remoteDescription, e.transceiver?.mid);
      trackId && track.setSdpTrackId(trackId);
      remote.tracks.push(track);
      this.observer.onTrackAdd(track);
    };
  }

  constructor(
    signal: ISignal,
    config: RTCConfiguration,
    observer: ISubscribeConnectionObserver,
    serverSubDegrade: boolean,
  ) {
    super(HMSConnectionRole.Subscribe, signal);
    this.observer = observer;
    this.serverSubDegrade = serverSubDegrade;

    this.nativeConnection = new RTCPeerConnection(config);
    this.initNativeConnectionCallbacks();
  }

  sendOverApiDataChannel(message: string) {
    if (this.apiChannel && this.apiChannel.readyState === 'open') {
      this.apiChannel.send(message);
    } else {
      HMSLogger.w(this.TAG, `API Data channel not ${this.apiChannel ? 'open' : 'present'}, queueing`, message);
      this.pendingMessageQueue.push(message);
    }
  }

  async close() {
    await super.close();
    this.apiChannel?.close();
  }

  private handlePendingApiMessages = () => {
    if (this.pendingMessageQueue.length > 0) {
      HMSLogger.d(this.TAG, 'Found pending message queue, sending messages');
      this.pendingMessageQueue.forEach(msg => this.sendOverApiDataChannel(msg));
      this.pendingMessageQueue.length = 0;
    }
  };
}
