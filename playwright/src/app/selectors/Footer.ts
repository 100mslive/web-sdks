import { PageWrapper } from '../PageWrapper';

export class Footer {
  private page: PageWrapper;
  footer = 'div[data-testid="footer"]';

  meeting_audio_btn = 'button[data-testid="audio_btn"]';
  meeting_audio_on_btn = 'button[data-testid="audio_btn"] > svg[data-testid="audio_on_btn"]';
  meeting_audio_off_btn = 'button[data-testid="audio_btn"] > svg[data-testid="audio_off_btn"]';

  meeting_video_btn = 'button[data-testid="video_btn"]';
  meeting_video_on_btn = 'button[data-testid="video_btn"] > svg[data-testid="video_on_btn"]';
  meeting_video_off_btn = 'button[data-testid="video_btn"] > svg[data-testid="video_off_btn"]';

  leave_room_dropdown = 'button[data-testid="leave_end_dropdown_trigger"]';
  leave_room_btn = 'button[data-testid="leave_room_btn"]';
  just_leave_btn = 'div[data-testid="just_leave_btn"]';
  end_room_btn = "text='End Room for All'";
  lock_end_room = 'button[data-testid="lock_end_room"]';

  screen_share_btn = 'div > button:right-of(button[data-testid="video_btn"])'; 
  stop_screen_share_btn = 'button[data-testid="stop_screen_share_btn"]';

  more_settings_btn = 'button[data-testid="more_settings_btn"]';

  change_name_btn = 'div[data-testid="change_name_btn"]';
  change_name_field = 'input[data-testid="change_name_field"]';
  popup_change_btn = 'button[data-testid="popup_change_btn"]';

  //bulk role ids
  bulk_role_change_btn = 'div[data-testid="bulk_role_change_btn"]';
  for_role_dropdown = 'div[data-testid="Select Multiple Roles_selector"]';
  for_role_checkbox = "text='audio-video-sshare'"
  for_role_label = "text='For Roles:'"
  to_role_dropdown = 'div[data-testid="Select Role_selector"]';
  to_role = "text='audio-video'"
  apply_btn = "text='Apply'";

  streaming_recording_btn = 'div[data-testid="streaming_recording_btn"]';
  streaming_metting_url_field = 'input[data-testid="metting_url_field"]';
  streaming_rtmp_url_field = 'input[data-testid="rtmp_url_field"]';
  rtmp_recording_stop_btn = 'button[data-testid="rtmp_recording_stop"]';
  rtmp_recording_start_btn = 'button[data-testid="rtmp_recording_start"]';
  hls_checkbox = '#hlsCheckbox';
  recording_checkbox = '#recordingCheckbox';

  twitch_live_now = '(//div[@class="Layout-sc-nxg1ff-0 KEuEf"])[1]';
  twitch_url = 'https://www.twitch.tv/ronit100ms';

  full_screen_btn = 'div[data-testid="full_screen_btn"]';
  mute_all_btn = 'div[data-testid="mute_all_btn"]';
  mute_all_apply_btn = 'text=Apply';

  embed_url_cta = '[data-testid="embed_url_btn"]';
  embed_url_text_field = 'input[placeholder="https://www.tldraw.com/"]';
  valid_embed_url = 'https://www.100ms.live/';
  invalid_embed_url = 'sdet.qa';
  embed_cta = 'text="Just Embed"';
  update_embed_cta = 'text="Update Embed"'
  stop_embed_cta = 'text="Stop Embed"'
  embed_share_cta = 'text="Embed and Share"';
  invalid_embed_link_header = 'text="Link is invalid"'
  inavlid_embed_link_subject = 'text="The room code does not exist. Please check the room code."';

  ui_settings_btn = 'div[data-testid="ui_settings_btn"]';
  device_settings_btn = 'div[data-testid="device_settings_btn"]';
  stats_for_nreds_btn = 'div[data-testid="stats_for_nreds_btn"]';
  enable_sfn = '[role="switch"]'
  close_sfn_modal = '[data-testid="stats_dialog_close_icon"]'

  change_my_role_btn = 'div[data-testid="change_my_role_btn"]';
  change_to_role_ = 'div[data-testid="change_to_role_?"]';

  dialoge_cross_icon = 'button[data-testid="dialoge_cross_icon"]';

  //bottom right corner
  raise_hand_btn = 'button[data-testid="hand_raise_btn"]';
  brb_btn = '(//button[@data-testid="brb_btn"])[2]';
  chat_btn = '[data-testid="chat_btn"] >> visible=true';
  chat_placeholder = 'css=[placeholder="Send a message...."]';
  emoji_btn = '[data-testid="emoji_reaction_btn"]';
  emoji_container = '[class="emoji-mart-emoji"]';
  expected_emoji_container_text = 'Reactions will be timed for Live Streaming viewers.';
  expected_emoji_container_href_text = 'Learn more';
  emoji_container_text = '//*[@role="menu"]/div[3]/p[1]'
  emoji_container_href = '[role="menu"] div p a'
  expected_emoji_href_link = 'https://www.100ms.live/docs/javascript/v2/how--to-guides/record-and-live-stream/hls/hls-timed-metadata'

  first_chat_msg = 'div[data-testid="chat_msg"]';

  chat_peer_selector = 'text=Everyone';
  chat_to_text = '[data-testid="chat_msg"] >> p >> nth=1';
  chat_msg = '[data-testid="chat_msg"]';
  chat_msg_options = '[data-testid="chat_msg"] >> button';
  pin_message = 'text=Pin Message'

  //bottom left corner
  screenshare_audio = 'button[data-testid="screenshare_audio"]';
  audio_playlist = 'button[data-testid="audio_playlist"]';
  video_playlist = 'button[data-testid="video_playlist"]';

  playlist_play_pause_btn = 'button[data-testid="playlist_play_pause_btn"]';
  playlist_next_btn = 'button[data-testid="playlist_next_btn"]';
  playlist_prev_btn = 'button[data-testid="playlist_prev_btn"]';
  playlist_cross_btn = 'text=Audio PlayerBrowse >> button';
  videoplayer_cross_btn = 'button[data-testid="videoplaylist_cross_btn"]';

  white_board_btn = 'button[data-testid="white_board_btn"]';
  virtual_bg_btn = 'button[data-testid="virtual_bg_btn"]';
  noise_supp_btn = 'button[data-testid="noise_suppression_btn"]';

  audio_playlist_item = 'div[role="menuitem"]:nth-child(?)';

  error_message = 'text=Resolution not supported';

  //Layout
  layout_button = 'button[id*="trigger-layout"]';
  activespeaker_toggle = 'button[id="activeSpeakerMode"]';
  activespeakersorting_toggle = 'button[id="activeSpeakerSortingMode"]';
  audioonly_toggle = 'button[id="audioOnlyMode"]';
  mirrorlocal_toggle = 'button[id="mirrorMode"]';
  hidelocal_toggle = 'button[id="hideLocalVideo"]';
  tilesinview_bar = 'span[dir="ltr"]';
  
  constructor(page: PageWrapper) {
    this.page = page;
  }

  async leaveRoom() {
    await this.page.click(this.leave_room_dropdown, this.just_leave_btn);
  }

  async endRoom() {
    await this.page.click(this.leave_room_dropdown, this.end_room_btn, this.lock_end_room);
  }

  /**
   * enabled = true => audio unmuted
   * enabled = false => audio muted
   * enabled = undefined => audio button not visible
   */
  async assertLocalAudioState(enabled?: boolean) {
    if (enabled) {
      await this.page.assertVisible(this.meeting_audio_on_btn);
    } else if (enabled === false) {
      await this.page.assertVisible(this.meeting_audio_off_btn);
    } else {
      await this.page.assertNotVisible(this.meeting_audio_btn);
    }
  }

  /**
   * enabled = true => audio unmuted
   * enabled = false => audio muted
   * enabled = undefined => audio button not visible
   */
  async assertLocalVideoState(enabled?: boolean) {
    if (enabled) {
      await this.page.assertVisible(this.meeting_video_on_btn);
    } else if (enabled === false) {
      await this.page.assertVisible(this.meeting_video_off_btn);
    } else {
      await this.page.assertNotVisible(this.meeting_video_btn);
    }
  }

  /**
   * TODO: take {source: string, type: "audio/video", state: true/false}
   */
  async muteAll() {
    await this.openMoreSettings();
    await this.page.click(this.mute_all_btn, this.mute_all_apply_btn);
  }

  async changeName(newName: string) {
    await this.openMoreSettings();
    await this.page.click(this.change_name_btn);
    await this.page.sendText(this.change_name_field, newName);
    await this.page.click(this.popup_change_btn);
  }

  /**
   * @private
   */
  async openMoreSettings() {
    await this.page.click(this.more_settings_btn);
  }

  async openBulkRoleChange(){
    await this.page.click(this.bulk_role_change_btn);
  }

  async openRoleForChange(){
    await this.page.click(this.for_role_dropdown);
  }

  async selectForRoleForChange(){
    await this.page.click(this.for_role_checkbox);
  }

  async selectToRoleDropdown(){
    await this.page.click(this.to_role_dropdown);
  }

  async selectToRole(){
    await this.page.click(this.to_role);
  }

  async clickApplyButton(){
    await this.page.click(this.apply_btn);
  }

}
