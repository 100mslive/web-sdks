import { PageWrapper } from "../PageWrapper";

export class Header {
  private page: PageWrapper;

  header = 'div[data-testid="header"]';
  pip_btn = 'button[data-testid="pip_btn"]';

  //rtmp, hls, recording, playlist dropdown
  record_status_dropdown = 'div[data-testid="record_status_dropdown"]';
  playlist_playing = "text=Playlist is playing";
  playlist_playing_play = "text=Play";
  playlist_playing_pause = "text=Pause";
  whiteboard_owner = "text=Whiteboard Owner -";
  whiteboard_stop = "text=Stop";
  streaming_rtmp = 'div[role="menuitem"]:has-text("Streaming (RTMP)")';
  streaming_hls = 'div[role="menuitem"]:has-text("Streaming (HLS)")';
  browser_recording = 'div[role="menuitem"]:has-text("Recording (Browser)")';
  hls_recording = 'div[role="menuitem"]:has-text("Recording (HLS)")';

  //participant list dropdown
  participant_list = 'div[data-testid="participant_list"]';
  participant_name = 'div[data-testid="participant_?"]';
  participant_setting = 'div[data-testid="participant_?"] button';
  participant_role_heading = 'p[data-testid="role_?"]';
  dialog_select_change_role_to = 'div[data-testid="dialog_select_Change role to"]';
  role_list = [
    "audio",
    "audio-video",
    "audio-video-sshare",
    "hls-viewer",
    "screenshare",
    "video",
    "viewer",
  ];
  setting_role_peer = 'div[role="group"]:nth-child(?) button';
  peerlist_network = 'div[data-testid="participant_?"] span[data-testid="tile_network"]';

  constructor(page: PageWrapper) {
    this.page = page;
  }

  async assertPeerInPeerList(peerName: string, present: boolean) {
    await this.openParticipantList();
    try {
      await this.assertPeerInOpenPeerList(peerName, present);
    } finally {
      await this.closeParticipantList();
    }
  }

  async assertPeerInOpenPeerList(peerName: string, present: boolean) {
    if (present) {
      await this.page.assertVisible(this.participant_name.replace("?", peerName));
    } else {
      await this.page.assertNotVisible(this.participant_name.replace("?", peerName));
    }
  }

  /**
   * @private
   */
  async openParticipantList() {
    await this.page.click(this.participant_list);
  }

  /**
   * @private
   */
  async closeParticipantList() {
    await this.page.click("html");
  }
}
