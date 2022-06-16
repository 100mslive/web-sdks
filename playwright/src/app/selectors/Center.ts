import { PageWrapper } from "../PageWrapper";

export class Center {
  private page: PageWrapper;

  conferencing = 'div[data-testid="conferencing"]';
  participant_tile = 'div[data-testid="participant_tile_?"]';
  audio_mute_icon_onTile = 'div[data-testid="participant_audio_mute_icon"]';
  raiseHand_icon_onTile = 'div[data-testid="raiseHand_icon_onTile"]';
  brb_icon_onTile = 'div[data-testid="brb_icon_onTile"]';
  name_onTile = "div[data-testid=participant_tile_?] div[data-testid=participant_name_onTile]";
  first_person_img = 'div[data-testid="first_person_img"]';
  network_ontile = 'div[data-testid="participant_tile_?"] span[data-testid="tile_network"]';
  mute_ontile =
    'div[data-testid="participant_tile_?"] div[data-testid="participant_audio_mute_icon"]';

  participant_tile_menu_btn =
    'div[data-testid="participant_tile_?"] button[data-testid="participant_menu_btn"]';
  tile_menu_remove_participant = 'button[data-testid="remove_participant_btn"]';
  tile_menu_mute_video = 'button[data-testid="mute_video_participant_btn"]';
  tile_menu_unmute_video = 'button[data-testid="unmute_video_participant_btn"]';
  tile_menu_mute_audio = 'button[data-testid="mute_audio_participant_btn"]';

  //after end room
  join_again_btn = 'button[data-testid="join_again_btn"]';
  go_to_dashboard_btn = 'button[data-testid="go_to_dashboard_btn"]';

  //dialoge
  dialog_confirm = "text=Confirm";
  dialog_accept = "text=Accept";

  //network
  network_offline_notification = "text=You are offline for now. while we try to reconnect, please check your internet connection.";
  network_connected_notification = "text=You are now connected";

  constructor(page: PageWrapper) {
    this.page = page;
  }

  async assertTilePresence(peerName: string, present: boolean) {
    if (present) {
      await this.page.assertVisible(this.participant_tile.replace("?", peerName));
    } else {
      await this.page.assertNotVisible(this.participant_tile.replace("?", peerName));
    }
  }

  async assertAudioState(peerName: string, enabled: boolean) {
    if (!enabled) {
      await this.page.assertVisible(this.mute_ontile.replace("?", peerName));
    }
  }
}
