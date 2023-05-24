import { BrowserContext, ChromiumBrowserContext, Dialog, expect, Page as PlaywrightPage } from '@playwright/test';
import { PreviewPage } from './selectors/PreviewPage';
import { PrePreviewPage } from './selectors/PrePreviewPage';
import { HlsViewerPage } from './selectors/HlsViewerPage';
import { Header } from './selectors/Header';
import { Center } from './selectors/Center';
import { Footer } from './selectors/Footer';

export class PageWrapper {
  [x: string]: any;
  private page: PlaywrightPage;
  localName: string;
  prepreview: PrePreviewPage;
  preview: PreviewPage;
  hlsViewer: HlsViewerPage;
  header: Header;
  center: Center;
  footer: Footer;

  constructor(page: PlaywrightPage) {
    this.page = page;
    this.localName = '';
    this.preview = new PreviewPage(this);
    this.prepreview = new PrePreviewPage(this);
    this.header = new Header(this);
    this.footer = new Footer(this);
    this.center = new Center(this);
    this.hlsViewer = new HlsViewerPage(this);
  }

  static async openMeetingPage(nativePage: PlaywrightPage, joinConfig?: JoinConfig) {
    const page = new PageWrapper(nativePage);
    await page.gotoMeetingRoom(joinConfig);
    return page;
  }

  static async openHLSMeetingPage(nativePage: PlaywrightPage, joinConfig?: JoinConfig) {
    const page = new PageWrapper(nativePage);
    await page.gotoHLSMeetingRoom(joinConfig);
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
    this.page.on('dialog', async (dialog: Dialog) => {
      console.log('Dialog opened', dialog.message());
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

  async gotoHLSMeetingRoom({ url, name }: JoinConfig = {}) {
    url = url || `${process.env.hls_viewer_url}`;
    name = name || `${process.env.peer_name}0`;
    await this.hlsViewer.gotoHLSMeetingRoom(url, name);
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

  async assertEnabled(elementId: string) {
    await this.page.locator(elementId).isEnabled();
  }

  async assertDisabled(elementId: string) {
    await this.page.locator(elementId).isDisabled();
  }
  
  async assertVisible(elementId: string) {
    console.log('going to assert visibility', elementId);
    await this.page.waitForSelector(elementId, { state: 'visible' });
    console.log('asserted visibility for', elementId);
  }

  async checkScreenMode() {
    const isFullScreen = await this.page.evaluate(() => {
      return document.fullscreenElement !== null;
    });
    return isFullScreen;
  }

  locator(elementSelector: string) {
    return this.page.locator(elementSelector);
  }

  async assertNotVisible(elementId: string) {
    console.log('going to assert non visibility', elementId);
    await expect(this.page.locator(elementId)).not.toBeVisible();
    console.log('asserted non visibility for', elementId);
  }

  async sendText(elementId: string, text: string) {
    await this.page.locator(elementId).fill(text);
    console.log('Text sent: ', text, 'to element', elementId);
  }

  async hasText(elementId: string, msgSent: string) {
    const innerText = (await this.getText(elementId)) as string;
    expect(innerText.includes(msgSent)).toBeTruthy();
  }

  async hasLink(elementId: string, hrefLink: string){
    const emojiHref = await this.page.locator(elementId).getAttribute('href');
    expect(emojiHref?.includes(hrefLink))
  }

  /**
   * @returns {String}
   */
  async getText(elementId: string) {
    const text = await this.page.locator(elementId).textContent();
    console.log('Text Found- ', text);
    return text;
  }

  async gotoPreviewPage() {
    await this.prepreview.gotoPreviewPage(this.localName);
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

  async evaluateCommand(command: string) {
    await this.page.evaluate(command);
  }

  async endRoom() {
    try {
      await this.footer.endRoom();
    } catch (e) {
      console.log('No room to end', e);
    }
  }

  async getUrl() {
    const currentUrl = this.page.url();
    console.log('currentURL: ', currentUrl);
    return currentUrl;
  }

  // async selectPopupOption(selectId: string, locatorId: string) {
  //   await this.page.locator(locatorId).selectOption(selectId);
  // }

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
    console.log('Clicked: ', elementId);
  }

  async hover(elementId: string) {
    await this.page.hover(elementId);
    console.log('Hovered: ', elementId);
  }

  async setInternetEnabled(enabled: boolean) {
    const isOffline = !enabled;
    if (enabled) {
      this.emulateNetwork(isOffline, 0, 500, 500);
    } else {
      this.emulateNetwork(isOffline, -1, -1, -1);
    }
    console.log('Internet enabled: ', enabled);
  }

  /**
   * function to emulate network traffic
   * pass offline : true for making page offline
   */
  async emulateNetwork(offline: boolean, latency: number, downloadThroughput: number, uploadThroughput: number) {
    const context = this.page.context() as ChromiumBrowserContext;
    const client = await context.newCDPSession(this.page);
    await client.send('Network.emulateNetworkConditions', {
      offline: offline,
      latency: latency,
      downloadThroughput: downloadThroughput,
      uploadThroughput: uploadThroughput,
    });
  }

  async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * accepts string values like F1 - F12, Digit0- Digit9, KeyA- KeyZ, Backquote, Minus, Equal,
   *  Backslash, Backspace, Tab, Delete, Escape, ArrowDown, End, Enter, Home, Insert, PageDown, PageUp, ArrowRight, ArrowUp
   */
  async pressKey(key: string) {
    await this.page.keyboard.press(key);
  }

  /**
   * function to send message in chat to all, any peer or
   * peers with specific role. Pass msg and "all", or "peername" or "roleName" for sending
   * message to all or particular peer or peers with specific role.
   */
  async sendMessage(msg: string, to: string) {
    await this.page.click(this.footer.chat_btn);
    if (to == 'all') {
      await this.sendText(this.footer.chat_placeholder, msg);
    } else {
      await this.selectPeerOrRole(to);
      await this.sendText(this.footer.chat_placeholder, msg);
    }
    await this.pressKey('Enter');
  }

  /**
   * function to select peer or role in chat
   * pass peer name or role name to chat with
   */
  async selectPeerOrRole(name: string) {
    await this.page.click(this.footer.chat_peer_selector);
    await this.page.click(`text=${name}`);
  }
}

export interface JoinConfig {
  url?: string;
  name?: string;
  cam?: boolean;
  mic?: boolean;
}
