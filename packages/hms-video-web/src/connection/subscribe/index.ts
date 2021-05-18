import HMSConnection from '../index';
import { ISignal } from '../../signal/ISignal';
import ISubscribeConnectionObserver from './ISubscribeConnectionObserver';
import { HMSConnectionRole } from '../model';
import HMSRemoteStream from '../../media/streams/HMSRemoteStream';
import HMSDataChannel from '../HMSDataChannel';
import { API_DATA_CHANNEL } from '../../utils/constants';
import HMSRemoteAudioTrack from '../../media/tracks/HMSRemoteAudioTrack';
import HMSRemoteVideoTrack from '../../media/tracks/HMSRemoteVideoTrack';

export default class HMSSubscribeConnection extends HMSConnection {
  private readonly remoteStreams = new Map<string, HMSRemoteStream>();

  private readonly observer: ISubscribeConnectionObserver;
  readonly nativeConnection: RTCPeerConnection;

  private _apiChannel: HMSDataChannel | null = null;

  public get apiChannel(): HMSDataChannel {
    // TODO: Wait for the channel to be open;
    return this._apiChannel!;
  }

  private initNativeConnectionCallbacks() {
    this.nativeConnection.oniceconnectionstatechange = () => {
      this.observer.onIceConnectionChange(this.nativeConnection.iceConnectionState);
    };

    this.nativeConnection.ondatachannel = (e) => {
      if (e.channel.label !== API_DATA_CHANNEL) {
        // TODO: this.observer.onDataChannel(e.channel);
        return;
      }

      this._apiChannel = new HMSDataChannel(
        e.channel,
        {
          onMessage: (value: string) => {
            this.observer.onApiChannelMessage(value);
          },
        },
        `role=${this.role}`,
      );
    };

    this.nativeConnection.onicecandidate = (e) => {
      if (e.candidate !== null) {
        this.signal.trickle(this.role, e.candidate);
      }
    };

    this.nativeConnection.ontrack = (e) => {
      const stream = e.streams[0];
      if (!this.remoteStreams.has(stream.id)) {
        const remote = new HMSRemoteStream(stream, this);
        this.remoteStreams.set(stream.id, remote);

        stream.onremovetrack = (e) => {
          const toRemoveTrackIdx = remote.tracks.findIndex((track) => track.trackId === e.track.id);
          if (toRemoveTrackIdx >= 0) {
            const toRemoveTrack = remote.tracks[toRemoveTrackIdx];
            this.observer.onTrackRemove(toRemoveTrack);
            remote.tracks.splice(toRemoveTrackIdx, 1);

            // If the length becomes 0 we assume that stream is removed entirely
            if (remote.tracks.length === 0) {
              this.remoteStreams.delete(stream.id);
            }
          }
        };
      }

      const remote = this.remoteStreams.get(stream.id)!;
      const TrackCls = e.track.kind === 'audio' ? HMSRemoteAudioTrack : HMSRemoteVideoTrack;
      const track = new TrackCls(remote, e.track);
      remote.tracks.push(track);
      this.observer.onTrackAdd(track);
    };
  }

  constructor(signal: ISignal, config: RTCConfiguration, observer: ISubscribeConnectionObserver) {
    super(HMSConnectionRole.Subscribe, signal);
    this.observer = observer;

    this.nativeConnection = new RTCPeerConnection(config);
    this.initNativeConnectionCallbacks();
  }

  async close() {
    await super.close();
    this.apiChannel?.close();
  }
}
