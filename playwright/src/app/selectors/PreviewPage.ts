import { PageWrapper } from "../PageWrapper";

export class PreviewPage {
  private page: PageWrapper;

  preview_name_field = 'input[data-testid="preview_name_field"]';
  preview_join_btn = 'button[data-testid="preview_join_btn"]';
  preview_audio_btn = 'button[data-testid="audio_btn"]';
  preview_audio_on_btn = 'button[data-testid="audio_btn"] > svg[data-testid="audio_on_btn"]';
  preview_audio_off_btn = 'button[data-testid="audio_btn"] > svg[data-testid="audio_off_btn"]';
  preview_video_btn = 'button[data-testid="video_btn"]';
  preview_video_on_btn = 'button[data-testid="video_btn"] > svg[data-testid="video_on_btn"]';
  preview_video_off_btn = 'button[data-testid="video_btn"] > svg[data-testid="video_off_btn"]';
  preview_setting_btn = 'button[data-testid="preview_setting_btn"]';
  preview_tile_network = 'span[data-testid="tile_network"]';
  preview_tile = 'video[data-testid="preview_tile"]';
  preview_avatar_tile = 'div[data-testid="preview_avatar_tile"]';
  dialoge_cross_icon = 'button[data-testid="dialoge_cross_icon"]';
  dialoge_select_settings = 'div[data-testid="dialog_select_?"]';
  preview_setting_btn_list = ["Video", "Microphone", "Speaker"];

  constructor(page: PageWrapper) {
    this.page = page;
  }

  async gotoPreviewPage() {
    await this.page.goto();
  }

  async gotoMeetingRoom(url: string, name: string, mic: boolean, cam: boolean) {
    if (!mic && !cam) {
      url = url.replace("meeting", "preview");
      url += `?skip_preview_headful=true&name=${name}`;
      await this.page.goto({ url });
    } else {
      await this.page.goto({ url });
      if (!cam) {
        await this.page.click(this.preview_video_btn);
      }
      if (!mic) {
        await this.page.click(this.preview_audio_btn);
      }
      await this.page.sendText(this.preview_name_field, name);
      await this.page.click(this.preview_join_btn);
    }
    console.log("Joined room with : ", "mic:", mic, " cam:", cam);
  }
}
