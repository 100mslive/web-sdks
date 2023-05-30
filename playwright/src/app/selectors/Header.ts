import { PageWrapper } from '../PageWrapper';

export class Header {
  private page: PageWrapper;

  header = 'div[data-testid="header"]';
  pip_btn = 'button[data-testid="pip_btn"]';

  //rtmp, hls, recording, playlist dropdown
  record_status_dropdown = 'div[data-testid="record_status_dropdown"]';
  playlist_playing = 'text=Playlist is playing';
  playlist_playing_play = 'text=Play';
  playlist_playing_pause = 'text=Pause';
  whiteboard_owner = 'text=Whiteboard Owner -';
  whiteboard_stop = 'text=Stop';
  streaming_rtmp = 'div[role="menuitem"]:has-text("Streaming (RTMP)")';
  streaming_hls = 'div[role="menuitem"]:has-text("Streaming (HLS)")';
  browser_recording = 'div[role="menuitem"]:has-text("Recording (Browser)")';
  hls_recording = 'div[role="menuitem"]:has-text("Recording (HLS)")';

  //participant list dropdown
  participant_list = 'button[data-testid="participant_list"]';
  participant_name = 'div[data-testid="participant_?"]';

  participant_setting = 'div[data-testid="participant_?"] div p[data-testid="participant_more_actions"]';
  participant_dropdown = 'div[data-testid="open_role_selection_dropdown"]';
  participant_role_heading = 'text=?';
  dialog_select_change_role_to = '//p[text()="Change Role"]';
  role_list = ['audio', 'audio-video', 'audio-video-sshare', 'hls-viewer', 'screenshare', 'video', 'viewer'];
  setting_role_peer = 'div[role="menuitem"]:nth-child(?) button';
  peerlist_network = 'div[data-testid="participant_?"] span[data-testid="tile_network"]';

  //recording
  start_recording_btn = 'button[data-testid="start_recording"]';
  start_recording_confirm_btn = 'button[data-testid="start_recording_confirm"]';
  recording_resolution_width_btn = 'input[data-testid="recording_resolution_width"]';
  recording_resolution_height_btn = 'input[data-testid="recording_resolution_height"]';
  stop_recording_btn = 'button[data-testid="stop_recording"]';
  stop_recording_confirm_btn = 'button[data-testid="stop_recording_confirm"]';

  //hls
  go_live_btn = 'button[data-testid="go_live"]';
  hls_stream_btn = 'div[data-testid="hls_stream"]';
  hls_recording_toggle = 'button[data-testid="hls-recording"]';
  start_hls_btn = 'button[data-testid="start_hls"]';
  stop_hls_btn = 'button[data-testid="stop_hls"]';
  end_stream_btn = 'button[data-testid="end_stream"]';
  live_indicator = 'text=Live with HLS';

  //rtmp
  rtmp_stream_btn = 'div[data-testid="rtmp_stream"]';
  rtmp_url_btn = 'input[data-testid="0_rtmp_url"]';
  rtmp_key_btn = 'input[data-testid="0_rtmp_key"]';
  rtmp_resolution_width_btn = 'input[data-testid="rtmp_resolution_width"]';
  rtmp_resolution_height_btn = 'input[data-testid="rtmp_resolution_height"]';
  rtmp_recording_btn = 'button[data-testid="rtmp_recording"]';
  add_stream_btn = 'div[data-testid="add_stream"]';
  start_rtmp_btn = 'button[data-testid="start_rtmp"]';
  stop_rtmp_btn = 'button[data-testid="stop_rtmp"]';
  rtmp_indicator = 'text=Live with RTMP';

  //close stream popup
  close_stream_section = 'div[data-testid="close_stream_section"]';
  go_back_btn = 'div[data-testid="go_back"]';
  close_streaming_btn = 'div[data-testid="close_streaming"]';

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
      await this.page.assertVisible(this.participant_name.replace('?', peerName));
    } else {
      await this.page.assertNotVisible(this.participant_name.replace('?', peerName));
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
    await this.page.click('html');
  }
}
