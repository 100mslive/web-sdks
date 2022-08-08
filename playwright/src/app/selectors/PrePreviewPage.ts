import { PageWrapper } from '../PageWrapper';

export class PrePreviewPage {
  private page: PageWrapper;

  pre_preview_name_field = 'input[placeholder="Enter your name"]';
  pre_preview_get_started_btn = 'text="Get Started "';

  constructor(page: PageWrapper) {
    this.page = page;
  }

  async gotoPreviewPage(name: string) {
    await this.page.goto();
    await this.page.sendText(this.pre_preview_name_field, name);
    await this.page.click(this.pre_preview_get_started_btn);
  }
}
