// eslint-disable-line
/* eslint-disable */
import { test } from '@playwright/test';

test.beforeEach(async () => {});

test.afterEach(async ({ context }) => {
    await context.close();
});

test(`Verify simulcast layer getting published as set in template`, async({context}) => {
    const cobroadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/lnw-zfmy-rzo';

    const page_cb1 = await context.newPage();
    await page_cb1.goto(cobroadcasterUrl);
    await page_cb1.getByPlaceholder('Enter name').fill('cb1');
    await page_cb1.getByText("Join Now").click();
    await page_cb1.waitForTimeout(2000);

    const page_cb2 = await context.newPage();
    await page_cb2.goto(cobroadcasterUrl);
    await page_cb2.getByPlaceholder('Enter name').fill('cb2');
    await page_cb2.getByText("Join Now").click();
    await page_cb2.waitForTimeout(2000);

    await page_cb1.bringToFront();
    await page_cb1.getByTestId("participant_tile_cb2").hover();
    await page_cb1.getByTestId("participant_menu_btn").waitFor();
    await page_cb1.getByTestId("participant_menu_btn").click();
    //await page_cb1.getByText("Currently streaming: High (1270x720)").click();

    await page_cb1.getByText("Remove Participant").scrollIntoViewIfNeeded;
    await page_cb1.getByText("low").isVisible();
    await page_cb1.getByText("medium").isVisible();
    await page_cb1.getByText("high").isVisible();

    await page_cb1.getByText("320x180").isVisible();
    await page_cb1.getByText("640x360").isVisible();
    await page_cb1.getByText("1280x720").isVisible();

    await page_cb1.getByTestId('leave_end_dropdown_trigger').click();
    await page_cb1.getByTestId('end_room_btn').click();
    await page_cb1.getByTestId('stop_stream_btn').click();

});

test(`Verify enable/disable virtual background`, async({context}) => {
    const cobroadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/jsw-bywh-usa';

    const page_cb1 = await context.newPage();
    await page_cb1.goto(cobroadcasterUrl);
    await page_cb1.getByTestId('video_on_btn').click();
    await page_cb1.getByTestId('virtual_bg_btn').isHidden();

    await page_cb1.getByTestId('video_off_btn').click();
    await page_cb1.getByTestId('virtual_bg_btn').click();

    await page_cb1.getByTestId('none').isVisible();
    await page_cb1.getByTestId('blur').isVisible();

    await page_cb1.getByTestId('virtual_bg_option-0').click();
    await page_cb1.getByTestId('virtual_bg_btn').click();

    await page_cb1.getByTestId('virtual_bg_btn').click();
    await page_cb1.getByTestId('none').click();
    await page_cb1.getByTestId('virtual_bg_btn').click();

    await page_cb1.getByPlaceholder('Enter name').fill('cb1');
    await page_cb1.getByText("Join Now").click();
    await page_cb1.waitForTimeout(2000);

    await page_cb1.getByTestId('video_on_btn').click();
    await page_cb1.getByTestId('virtual_bg_btn').isHidden();

    await page_cb1.getByTestId('video_off_btn').click();
    await page_cb1.getByTestId('virtual_bg_btn').click();

    await page_cb1.getByTestId('none').isVisible();
    await page_cb1.getByTestId('blur').isVisible();

    await page_cb1.getByTestId('virtual_bg_option-0').click();
    await page_cb1.getByTestId('virtual_bg_btn').click();

    await page_cb1.getByTestId('virtual_bg_btn').click();
    await page_cb1.getByTestId('none').click();
    await page_cb1.getByTestId('virtual_bg_btn').click();

    await page_cb1.getByTestId('leave_end_dropdown_trigger').click();
    await page_cb1.getByTestId('end_room_btn').click();
    await page_cb1.getByTestId('stop_stream_btn').click();
});