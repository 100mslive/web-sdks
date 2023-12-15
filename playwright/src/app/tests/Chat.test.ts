// eslint-disable-line
/* eslint-disable */
import { test } from '@playwright/test';

test.beforeEach(async () => {});

test.afterEach(async ({ context }) => {
    await context.close();
});

test(`Test peer can send and receive chat message`, async ({ context }) => {

    const broadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/kwq-tstr-tji';
    const cobroadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/wuu-xevt-jfv';
    const viewerNRTUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/off-okil-uiy';
    const webrtcviewer = 'https://automation-live-stream.app.100ms.live/streaming/meeting/tiv-dsbn-kpt';

    const page_b = await context.newPage();
    await page_b.goto(broadcasterUrl);
    await page_b.getByPlaceholder('Enter name').fill('broadcaster');
    await page_b.getByText("Go Live").click();
    await page_b.waitForTimeout(3000);

    const page_cb = await context.newPage();
    await page_cb.goto(cobroadcasterUrl);
    await page_cb.getByPlaceholder('Enter name').fill('co-broadcaster');
    await page_cb.getByText("Join Now").click();
    await page_cb.waitForTimeout(2000);

    const page_vnrt = await context.newPage();
    await page_vnrt.goto(viewerNRTUrl);
    await page_vnrt.getByPlaceholder('Enter name').fill('vnrt');
    await page_vnrt.getByText("Join Now").click();
    await page_vnrt.waitForTimeout(2000);

    const page_vrt = await context.newPage();
    await page_vrt.goto(webrtcviewer);
    await page_vrt.getByPlaceholder('Enter name').fill('vrt');
    await page_vrt.getByText("Join Now").click();
    await page_vrt.waitForTimeout(2000);

    await page_b.bringToFront();
    await page_b.locator("//textarea").fill('broadcastermsg');
    await page_b.getByTestId('send_msg_btn').click();

    await page_cb.bringToFront();
    await page_cb.locator("//div[@data-testid='chat_msg']//p[text()='broadcastermsg']").isVisible();
    await page_cb.locator("//textarea").fill('co-broadcastermsg');
    await page_cb.getByTestId('send_msg_btn').click();
    
    await page_vnrt.bringToFront();
    await page_vnrt.locator("//div[@data-testid='chat_msg']//p[text()='broadcastermsg']").isVisible();
    await page_vnrt.locator("//div[@data-testid='chat_msg']//p[text()='co-broadcastermsg']").isVisible();

    await page_vnrt.locator("//textarea").fill('vnrtmsg');
    await page_vnrt.getByTestId('send_msg_btn').click();

    await page_vrt.bringToFront();
    await page_vrt.locator("//div[@data-testid='chat_msg']//p[text()='broadcastermsg']").isVisible();
    await page_vrt.locator("//div[@data-testid='chat_msg']//p[text()='co-broadcastermsg']").isVisible();
    await page_vrt.locator("//div[@data-testid='chat_msg']//p[text()='vnrtmsg']").isVisible();

    await page_vrt.locator("//textarea").fill('vrtmsg');
    await page_vrt.getByTestId('send_msg_btn').click();

    await page_vnrt.bringToFront();
    await page_vnrt.locator("//div[@data-testid='chat_msg']//p[text()='vrtmsg']").isVisible();
    
    await page_cb.bringToFront();
    await page_cb.locator("//div[@data-testid='chat_msg']//p[text()='vrtmsg']").isVisible();
    await page_vrt.locator("//div[@data-testid='chat_msg']//p[text()='vnrtmsg']").isVisible();

    await page_b.bringToFront();
    await page_b.locator("//div[@data-testid='chat_msg']//p[text()='co-broadcastermsg']").isVisible();
    await page_b.locator("//div[@data-testid='chat_msg']//p[text()='vnrtmsg']").isVisible();
    await page_cb.locator("//div[@data-testid='chat_msg']//p[text()='vrtmsg']").isVisible();

    await page_b.getByTestId('leave_end_dropdown_trigger').click();
    await page_b.getByTestId('end_room_btn').click();
    await page_b.getByTestId('stop_stream_btn').click();
});


test(`Verify pin/unpin chat reflect to local+remote peer @chat`, async({context}) => {

    const cobroadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/lqh-lcej-ong';
    const viewerNRTUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/ylx-frpu-klf';

    const page_cb = await context.newPage();
    await page_cb.goto(cobroadcasterUrl);
    await page_cb.getByPlaceholder('Enter name').fill('co-broadcaster');
    await page_cb.getByText("Join Now").click();
    await page_cb.waitForTimeout(2000);

    const page_vnrt = await context.newPage();
    await page_vnrt.goto(viewerNRTUrl);
    await page_vnrt.getByPlaceholder('Enter name').fill('vnrt');
    await page_vnrt.getByText("Join Now").click();
    await page_vnrt.waitForTimeout(2000);

    await page_cb.bringToFront();
    await page_cb.locator("//textarea").fill('co-broadcastermsg');
    await page_cb.getByTestId('send_msg_btn').click();


});
