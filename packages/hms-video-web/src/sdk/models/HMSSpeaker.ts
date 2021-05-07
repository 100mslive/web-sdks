import HMSSpeaker from '../../interfaces/speaker';

export class Speaker implements HMSSpeaker {
  peerId: string;
  trackId: string;
  audioLevel: number = 0;

  constructor(peerId: string, trackId: string, audioLevel: number) {
    this.peerId = peerId;
    this.trackId = trackId;
    this.audioLevel = audioLevel;
  }
}

export class SpeakerList {
  speakers: HMSSpeaker[] = [];

  constructor(speakerList: any) {
    if (speakerList && speakerList.length > 0) {
      this.speakers = speakerList.map((speaker: any) => new Speaker(speaker.peer_id, speaker.track_id, speaker.level));
    }
  }
}
