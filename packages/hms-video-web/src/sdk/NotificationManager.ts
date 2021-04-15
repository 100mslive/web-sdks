import HMSTrack from '../media/tracks/HMSTrack';
import { HMSTrackType } from '../media/tracks/HMSTrackType';
import Peer from '../peer';
import { HMSNotificationMethod } from './models/enums/HMSNotificationMethod';
import { Peer as PeerNotification, HMSNotifications } from './models/HMSNotifications';
import log from 'loglevel';

export default class NotificationManager {
  hmsPeerList!: Peer[];

  private TAG: string = 'NotificationManager';
  private streamIdToUIDMap: Map<string, string> = new Map<string, string>();
  private streamIdToTrackMap: Map<string, HMSTrack> = new Map<string, HMSTrack>();

  handleNotification = (method: HMSNotificationMethod, notification: HMSNotifications) => {
    switch (method) {
      case HMSNotificationMethod.PEER_JOIN:
        log.debug(this.TAG, `PEER_JOIN event :: ${notification}`);
        this.handlePeerJoin(notification as PeerNotification);
        break;
      case HMSNotificationMethod.PEER_LEAVE:
        log.debug(this.TAG, `PEER_LEAVE event :: ${notification}`);
        this.handlePeerLeave(notification as PeerNotification);
        break;

      case HMSNotificationMethod.PEER_LIST:

      case HMSNotificationMethod.STREAM_ADD:

      case HMSNotificationMethod.ACTIVE_SPEAKERS: //TODO: Write code for this
        return;

      default:
        return;
    }
  };

  /**
   * Sets the tracks to peer and returns the peer
   */
  handleOnTrackAdd = (track: HMSTrack) => {
    log.debug(this.TAG, `ONTRACKADD :: ${track}`);
    const streamId = track.stream.id;
    const hmsPeer = this.streamIdToUIDMap.get(streamId)
      ? this.findPeerByUID(this.streamIdToUIDMap.get(streamId)!)
      : null;

    if (hmsPeer) {
      // Peer-JOIN has come already
      switch (track.type) {
        case HMSTrackType.AUDIO:
          hmsPeer!.audioTrack = track;
          break;
        case HMSTrackType.VIDEO:
          hmsPeer!.videoTrack = track;
      }
    } else {
      // Peer-JOIN has not yet come
      this.streamIdToTrackMap.set(streamId, track);
    }

    return hmsPeer;
  };

  /**
   * Sets the track of corresponding peer to null and returns the peer
   */
  handleOnTrackRemove = (track: HMSTrack) => {
    log.debug(this.TAG, `ONTRACKREMOVE :: ${track}`);
    const uid = this.streamIdToUIDMap.get(track.stream.id);
    const hmsPeer = uid && this.findPeerByUID(uid);
    if (hmsPeer) {
      switch (track.type) {
        case HMSTrackType.AUDIO:
          hmsPeer.audioTrack = null;
          break;
        case HMSTrackType.VIDEO:
          hmsPeer.videoTrack = null;
      }
    } else {
      log.error(this.TAG, `No peer found for track ${track}`);
    }

    return hmsPeer;
  };

  private handlePeerJoin = (peer: PeerNotification) => {
    const hmsPeer = new Peer({
      peerId: peer.uid,
      name: peer.info!.userName!,
      isLocal: false,
      customerDescription: peer.info!.metadata!,
    });
    this.hmsPeerList.push(hmsPeer);
  };

  private handlePeerLeave = (peer: PeerNotification) => {
    const hmsPeer = this.findPeerByUID(peer.uid);
    const peerIdx = hmsPeer && this.hmsPeerList.indexOf(hmsPeer);
    peerIdx && peerIdx > -1 && this.hmsPeerList.splice(peerIdx, 1);
  };

  findPeerByUID = (uid: string) => {
    return this.hmsPeerList.find((hmsPeer) => hmsPeer.peerId === uid);
  };
}
