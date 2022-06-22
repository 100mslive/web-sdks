import { BrowserContext, ChromiumBrowserContext, Dialog, expect, Page as PlaywrightPage} from "@playwright/test";
import { PreviewPage } from "./selectors/PreviewPage";
import { Header } from "./selectors/Header";
import { Center } from "./selectors/Center";
import { Footer } from "./selectors/Footer";

export class PageWrapper {
  private page: PlaywrightPage;
  localName: string;
  preview: PreviewPage;
  header: Header;
  center: Center;
  footer: Footer;

  constructor(page: PlaywrightPage) {
    this.page = page;
    this.localName = "";
    this.preview = new PreviewPage(this);
    this.header = new Header(this);
    this.footer = new Footer(this);
    this.center = new Center(this);
  }

  static async openMeetingPage(nativePage: PlaywrightPage, joinConfig?: JoinConfig) {
    const page = new PageWrapper(nativePage);
    await page.gotoMeetingRoom(joinConfig);
    return page;
  }

  /**
   * open n number of pages and goto meeting room in all of them
   */
  static async openPages(context: BrowserContext, n: number, joinConfig?: JoinConfig) {
    const pages = [];
    const promises = [];
    for (let i = 0; i < n; i++) {
      joinConfig = joinConfig || {};
      joinConfig.name = process.env.peer_name + i;
      pages[i] = new PageWrapper(await context.newPage());
      promises.push(pages[i].gotoMeetingRoom(joinConfig));
    }
    await Promise.all(promises);
    return pages;
  }

  acceptDialogWhenPrompted() {
    this.page.on("dialog", async (dialog: Dialog) => {
      console.log("Dialog opened", dialog.message());
      await dialog.accept();
    });
  }

  async gotoMeetingRoom({ url, name, mic, cam }: JoinConfig = {}) {
    url = url || process.env.audio_video_screenshare_url;
    name = name || `${process.env.peer_name}0`;
    if (mic === undefined) {
      mic = false;
    }
    if (cam === undefined) {
      cam = false;
    }
    await this.preview.gotoMeetingRoom(url, name, mic, cam);
    this.localName = name;
  }

  async click(...elementIds: string[]) {
    for (const element of elementIds) {
      await this.clickOnce(element);
    }
  }

  async clickWithTimeout(timeoutMs: number, ...elementIds: string[]) {
    for (const element of elementIds) {
      await this.page.locator(element).click({ timeout: timeoutMs });
    }
  }

  async assertVisible(elementId: string) {
    console.log("going to assert visibility", elementId);
    await this.page.waitForSelector(elementId, { state: "visible" });
    console.log("asserted visibility for", elementId);
  }

  locator(elementSelector: string) {
    return this.page.locator(elementSelector);
  }

  async assertNotVisible(elementId: string) {
    console.log("going to assert non visibility", elementId);
    await expect(this.page.locator(elementId)).not.toBeVisible();
    console.log("asserted non visibility for", elementId);
  }

  async sendText(elementId: string, text: string) {
    await this.page.locator(elementId).fill(text);
    console.log("Text sent: ", text, "to element", elementId);
  }

  async hasText(elementId: string, text: string) {
    await expect(this.page.locator(elementId)).toContainText(text);
  }

  /**
   * @returns {String}
   */
  async getText(elementId: string) {
    const text = await this.page.locator(elementId).textContent();
    console.log("Text Found- ", text);
    return text;
  }

  async gotoPreviewPage() {
    await this.preview.gotoPreviewPage();
  }

  async goto({ url }: { url?: string } = {}) {
    url = url || process.env.audio_video_screenshare_url;
    await this.page.goto(url);
  }

  async timeout(timeMs: number) {
    await this.page.waitForTimeout(timeMs);
  }

  async close() {
    await this.page.close({ runBeforeUnload: true });
  }

  async endRoom() {
    try {
      await this.footer.endRoom();
    } catch (e) {
      console.log("No room to end", e);
    }
  }

  async getUrl() {
    const currentUrl = this.page.url();
    console.log("currentURL: ", currentUrl);
    return currentUrl;
  }

  async selectPopupOption(elementId: string) {
    await this.page.locator("select").selectOption(elementId);
  }

  async assertLocalAudioState(enabled?: boolean) {
    await this.footer.assertLocalAudioState(enabled);
  }

  async assertLocalVideoState(enabled?: boolean) {
    await this.footer.assertLocalVideoState(enabled);
  }

  /**
   * @internal
   * @private
   */
  async clickOnce(elementId: string) {
    // await expect(this.page.locator(elementId)).toBeEnabled();
    await this.page.locator(elementId).click();
    console.log("Clicked: ", elementId);
  }

  async hover(elementId: string) {
    await this.page.hover(elementId);
    console.log("Hovered: ", elementId);
  }

  /**
   * function to emulate network traffic 
   * pass offline : true for making page offline
   */
   async emulateNetwork(offline: boolean, latency: number, downloadThroughput: number, uploadThroughput: number){
    const context = await this.page.context() as ChromiumBrowserContext;
    const client = await context.newCDPSession(this.page);
    await client.send('Network.emulateNetworkConditions', 
    { 'offline': offline, 'latency':latency, 'downloadThroughput': downloadThroughput, 'uploadThroughput': uploadThroughput});
  }
}

export interface JoinConfig {
  url?: string;
  name?: string;
  cam?: boolean;
  mic?: boolean;
}
