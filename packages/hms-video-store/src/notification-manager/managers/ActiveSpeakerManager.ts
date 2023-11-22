import { HMSAudioListener, HMSPeerUpdate, HMSSpeaker, HMSUpdateListener } from '../../interfaces';
import { HMSAudioTrack } from '../../media/tracks';
import { Store } from '../../sdk/store';
import { SpeakerList } from '../HMSNotifications';

export class ActiveSpeakerManager {
  constructor(private store: Store, public listener?: HMSUpdateListener, public audioListener?: HMSAudioListener) {}

  handleActiveSpeakers(speakerList: SpeakerList) {
    const speakers = speakerList['speaker-list'];
    const hmsSpeakers: HMSSpeaker[] = speakers.map(speaker => ({
      audioLevel: speaker.level,
      peer: this.store.getPeerById(speaker.peer_id)!,
      track: this.store.getTrackById(speaker.track_id) as HMSAudioTrack,
    }));

    this.audioListener?.onAudioLevelUpdate(hmsSpeakers);
    this.store.updateSpeakers(hmsSpeakers);
    const dominantSpeaker = speakers[0];

    if (dominantSpeaker) {
      const dominantSpeakerPeer = this.store.getPeerById(dominantSpeaker.peer_id);
      this.listener?.onPeerUpdate(HMSPeerUpdate.BECAME_DOMINANT_SPEAKER, dominantSpeakerPeer!);
    } else {
      this.listener?.onPeerUpdate(HMSPeerUpdate.RESIGNED_DOMINANT_SPEAKER, null);
    }
  }
}
