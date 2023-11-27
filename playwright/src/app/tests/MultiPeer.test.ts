// eslint-disable-line
/* eslint-disable */
import { test } from '@playwright/test';

const hostUrl = 'https://automation-in.app.100ms.live/meeting/viq-mewq-usf';
const hlsViewerUrl = 'https://automation-in.app.100ms.live/meeting/zxk-oohm-shw';
const JoinBtn = 'Join Now';

test.beforeEach(async () => {});

test.afterEach(async ({ context }) => {
    await context.close();
});


test(`Verify viewer is not getting removed from peer list on raising hand-LIVE-1736`, async ({ context }) => {

        const page_host = await context.newPage();
        await page_host.goto(hostUrl);
        await page_host.getByPlaceholder('Enter name').fill('host');
        await page_host.getByText(JoinBtn).click();
        await page_host.waitForTimeout(5000);

        const page = await context.newPage();
        await page.goto(hlsViewerUrl);
        await page.getByPlaceholder('Enter name').fill('new hls viewer');
        await page.getByText(JoinBtn).click();
        await page.waitForTimeout(5000);

        await page.getByTestId('hand_raise_btn').click();
        await page.waitForTimeout(2000);
        await page.getByTestId('hand_raise_btn').click();

        await page_host.bringToFront();
        await page_host.getByTestId('participant_list').click();
        const peer_list_dropdown = page_host.locator("//div[@role='tabpanel' and @data-state='active']//h3").nth(1);
        await peer_list_dropdown.click();

        await page_host.getByText('new hls viewer',{ exact: true }).isVisible();
});

test(`Verify Peer does not disappear from the list after moving offstage-LIVE-1737`,async ({ context }) => {
        const broadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/lni-ylib-xho';
        const viewerNRTUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/jay-mnzo-czl';

        const page_host = await context.newPage();

        //Join as broadcaster
        await page_host.goto(broadcasterUrl);
        await page_host.getByPlaceholder('Enter name').fill('broadcaster');
        await page_host.getByText("Join Now").click();
        await page_host.waitForTimeout(10000);

        //Join as vnrt
        const page = await context.newPage();
        await page.goto(viewerNRTUrl);
        await page.getByPlaceholder('Enter name').fill('vnrt');
        await page.getByText(JoinBtn).click();
        await page.waitForTimeout(5000);

        //Hand raise for vnrt
        await page.getByTestId('hand_raise_btn').click();
        await page.waitForTimeout(2000);

        //Go to broadcaster and click brint to stage notification
        await page_host.bringToFront();
        await page_host.getByText('Bring to stage').click();

        //Accpet invite
        await page.bringToFront();
        await page.getByText('Accept').click();

        //Go back to broadcaster
        await page_host.bringToFront();
        await page_host.getByTestId('participant_list').click();
        const peer_list_dropdown = page_host.locator("//div[contains(@id,'Participants')]//h3[contains(.,'stage')]");
        await peer_list_dropdown.click();

        const vnrt_list = page_host.locator("//div[@data-testid='participant_vnrt']");
        await vnrt_list.hover();

        const peer_menu = page_host.locator("//div[@data-testid='participant_vnrt']//div[@data-testid='participant_more_actions']");
        await peer_menu.click();
        await page_host.getByText('Remove from stage').click();
        await page.waitForTimeout(5000);

        const new_peer_list_dropdown = page_host.locator("//div[contains(@id,'Participants')]//h3[contains(.,'realtime')]");
        await new_peer_list_dropdown.click();

        await page_host.getByTestId('participant_vnrt').isVisible();

});
