import { PageWrapper } from '../PageWrapper';

export class HlsViewerPage {
  private page: PageWrapper;

  hls_viewer_name_field = 'input[placeholder="Enter your name"]';
  hls_viewer_get_started_btn = 'text="Join Room"';

  expected_text= 'Waiting for the stream to start...'

  constructor(page: PageWrapper) {
    this.page = page;
  }

  async gotoHLSMeetingRoom(url: string, name: string) {
    await this.page.goto({url});
    await this.page.sendText(this.hls_viewer_name_field, name);
    await this.page.click(this.hls_viewer_get_started_btn);
  }
}
