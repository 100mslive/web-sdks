// eslint-disable-line
/* eslint-disable */
import { test } from '@playwright/test';

test.beforeEach(async () => {});

test.afterEach(async ({ context }) => {
    await context.close();
});


test(`Verify BRB and hand raise is displayed for other peers`, async({context}) => {
    const cobroadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/xgv-oagw-ahp';

    const cb_1 = await context.newPage();

    //Join as cb1
    await cb_1.goto(cobroadcasterUrl);
    await cb_1.getByPlaceholder('Enter name').fill('cb1');
    await cb_1.getByText("Join Now").click();

    //Join as cb2
    const cb_2 = await context.newPage();
    await cb_2.goto(cobroadcasterUrl);
    await cb_2.getByPlaceholder('Enter name').fill('cb2');
    await cb_2.getByText("Join Now").click();

    await cb_2.getByTestId("hand_raise_btn").click();
    await cb_1.bringToFront();

    await cb_1.getByText("cb1 raised hand").isVisible();
    await cb_1.locator("//div[@data-testid='participant_tile_cb2']//div[@data-testid='raiseHand_icon_onTile']/svg");

    await cb_2.bringToFront();
    await cb_2.getByTestId("hand_raise_btn").click();

    await cb_2.getByTestId("more_settings_btn").click();
    await cb_2.getByTestId("brb_btn").click();

    await cb_1.bringToFront();
    await cb_1.locator("//div[@data-testid='participant_tile_cb2']//div[@data-testid='brb_icon_onTile']/svg");
});

test(`Verify pin tile works for peer`, async({context}) => {
    const cobroadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/xgv-oagw-ahp';

    const cb_1 = await context.newPage();

    //Join as cb1
    await cb_1.goto(cobroadcasterUrl);
    await cb_1.getByPlaceholder('Enter name').fill('cb1');
    await cb_1.getByText("Join Now").click();

    //Join as cb2
    const cb_2 = await context.newPage();
    await cb_2.goto(cobroadcasterUrl);
    await cb_2.getByPlaceholder('Enter name').fill('cb2');
    await cb_2.getByText("Join Now").click();

    await cb_1.bringToFront();
    await cb_1.getByTestId("participant_tile_cb2").hover();
    await cb_1.getByTestId("participant_menu_btn").click();
    await cb_1.getByText("Pin Tile for myself").click();

    await cb_1.locator("//div[@data-testid='participant_tile_cb2']/div/div[3]/div/div").isVisible();

    await cb_1.getByTestId("participant_tile_cb2").hover();
    await cb_1.getByTestId("participant_menu_btn").click();
    await cb_1.getByText("Unpin Tile for myself").click();

    await cb_1.locator("//div[@data-testid='participant_tile_cb2']/div/div[3]/div/div").isHidden();
    await cb_1.getByTestId('leave_end_dropdown_trigger').click();
    await cb_1.getByTestId('end_room_btn').click();
    await cb_1.getByTestId('stop_stream_btn').click();
});

test(`Verify spotlight reflect to local and remote peer @meta`,async({context}) => {

    const cobroadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/pjk-bqfv-yhv';

    const cb_1 = await context.newPage();

    //Join as cb1
    await cb_1.goto(cobroadcasterUrl);
    await cb_1.getByPlaceholder('Enter name').fill('cb1');
    await cb_1.getByText("Join Now").click();

    //Join as cb2
    const cb_2 = await context.newPage();
    await cb_2.goto(cobroadcasterUrl);
    await cb_2.getByPlaceholder('Enter name').fill('cb2');
    await cb_2.getByText("Join Now").click();

    await cb_1.bringToFront();
    await cb_1.getByTestId("participant_tile_cb2").hover();
    await cb_1.getByTestId("participant_menu_btn").click();
    await cb_1.getByText("Spotlight Tile for everyone").click();

    await cb_1.locator("//div[@data-testid='participant_tile_cb2']/div/div[3]/div/div").isVisible();

    await cb_2.bringToFront();
    await cb_2.locator("//div[@data-testid='participant_tile_cb2']/div/div[3]/div/div").isVisible();

    await cb_1.bringToFront();
    await cb_1.getByTestId("participant_tile_cb2").hover();
    await cb_1.getByTestId("participant_menu_btn").click();
    await cb_1.getByText("Remove from Spotlight").click();

    await cb_1.locator("//div[@data-testid='participant_tile_cb2']/div/div[3]/div/div").isHidden();

    await cb_2.bringToFront();
    await cb_2.locator("//div[@data-testid='participant_tile_cb2']/div/div[3]/div/div").isHidden();

    await cb_2.getByTestId('leave_end_dropdown_trigger').click();
    await cb_2.getByTestId('end_room_btn').click();
    await cb_2.getByTestId('stop_stream_btn').click();
});