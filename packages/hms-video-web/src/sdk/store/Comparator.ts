import { HMSTrack } from '../..';
import { HMSTrackType } from '../../media/tracks';
import { HMSPeer } from '../models/peer';
import { IStore } from './IStore';

/**
 * Function passed as argument to the sort method of the list.
 * @returns a negative value if first argument is less than second argument, zero if they're equal and a positive value otherwise
 *
 * @see Array.sort
 */
type ComparatorFn<T> = (a: T, b: T) => number;

interface PeerComparators {
  videoEnabled: ComparatorFn<HMSPeer>;
  audioEnabled: ComparatorFn<HMSPeer>;
  screenShare: ComparatorFn<HMSPeer>;
  audioLevel: ComparatorFn<HMSPeer | undefined>;
  rolePriority: ComparatorFn<HMSPeer>;
}

interface TrackComparators {
  video: ComparatorFn<HMSTrack>;
  audio: ComparatorFn<HMSTrack>;
  enabled: ComparatorFn<HMSTrack>;
  audioLevel: ComparatorFn<HMSTrack>;
  peerAudioLevel: ComparatorFn<HMSTrack>;
  screenShare: ComparatorFn<HMSTrack>;
  rolePriority: ComparatorFn<HMSTrack>;
}

interface IComparator {
  getPeerComparators: () => PeerComparators;
  getTrackComparators: () => TrackComparators;
}

/**
 * Used to sort list of items(peers/tracks) based on common use cases.
 * Usage: peerList.sort(comparator.getPeerComparators().audioLevel);
 */
export class Comparator implements IComparator {
  constructor(private readonly store: IStore) {}

  getPeerComparators(): PeerComparators {
    return {
      videoEnabled: (peerA: HMSPeer, peerB: HMSPeer) =>
        this.primitiveComparator<boolean>(Boolean(peerA.videoTrack?.enabled), Boolean(peerB.videoTrack?.enabled)),

      audioEnabled: (peerA: HMSPeer, peerB: HMSPeer) =>
        this.primitiveComparator<boolean>(Boolean(peerA.audioTrack?.enabled), Boolean(peerB.audioTrack?.enabled)),

      screenShare: (peerA: HMSPeer, peerB: HMSPeer) =>
        this.primitiveComparator<boolean>(
          peerA.auxiliaryTracks.some((track) => track.source === 'screen'),
          peerB.auxiliaryTracks.some((track) => track.source === 'screen'),
        ),

      audioLevel: (peerA?: HMSPeer, peerB?: HMSPeer) =>
        this.primitiveComparator<number>(
          this.store.getSpeakers().find((speaker) => speaker.peer.peerId === peerA?.peerId)?.audioLevel || -1,
          this.store.getSpeakers().find((speaker) => speaker.peer.peerId === peerB?.peerId)?.audioLevel || -1,
        ),

      rolePriority: (peerA: HMSPeer, peerB: HMSPeer) =>
        this.primitiveComparator<number>(peerA.policy?.priority || 0, peerB.policy?.priority || 0),
    };
  }

  getTrackComparators(): TrackComparators {
    return {
      video: (trackA: HMSTrack, trackB: HMSTrack) =>
        this.primitiveComparator<boolean>(trackA.type === HMSTrackType.VIDEO, trackB.type === HMSTrackType.VIDEO),

      audio: (trackA: HMSTrack, trackB: HMSTrack) =>
        this.primitiveComparator<boolean>(trackA.type === HMSTrackType.AUDIO, trackB.type === HMSTrackType.AUDIO),

      enabled: (trackA: HMSTrack, trackB: HMSTrack) =>
        this.primitiveComparator<boolean>(Boolean(trackA.enabled), Boolean(trackB.enabled)),

      peerAudioLevel: (trackA: HMSTrack, trackB: HMSTrack) => {
        const peerA = this.store.getPeerByTrackId(trackA.trackId);
        const peerB = this.store.getPeerByTrackId(trackB.trackId);
        return this.getPeerComparators().audioLevel(peerA, peerB);
      },

      /**
       * Only HMSAudioTracks comparable as speaker objects have only HMSAudioTracks
       */
      audioLevel: (trackA: HMSTrack, trackB: HMSTrack) =>
        this.primitiveComparator<number>(
          this.store.getSpeakers().find((speaker) => speaker.track.trackId === trackA.trackId)?.audioLevel || 0,
          this.store.getSpeakers().find((speaker) => speaker.track.trackId === trackB.trackId)?.audioLevel || 0,
        ),

      screenShare: (trackA: HMSTrack, trackB: HMSTrack) =>
        this.primitiveComparator(trackA.source === 'screen', trackB.source === 'screen'),

      rolePriority: (trackA: HMSTrack, trackB: HMSTrack) =>
        this.primitiveComparator<number>(
          this.store.getPeerByTrackId(trackA.trackId)?.policy?.priority || 0,
          this.store.getPeerByTrackId(trackB.trackId)?.policy?.priority || 0,
        ),
    };
  }

  /**
   * @returns a negative value if a is less than b, zero if they're equal and a positive value otherwise
   */
  primitiveComparator = <T>(a: T, b: T): number => {
    return a === b ? 0 : Number(a) - Number(b);
  };

  stringComparator = (a: string, b: string) => (a === b ? 0 : a < b ? -1 : 1);
}
