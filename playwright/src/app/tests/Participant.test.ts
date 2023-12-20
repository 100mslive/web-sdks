// eslint-disable-line
/* eslint-disable */
import { test } from '@playwright/test';

test.beforeEach(async () => {});

test.afterEach(async ({ context }) => {
    await context.close();
});

test(`verify participant count`, async({context}) => {

    const broadcasterUrl = 'https://participant.app.100ms.live/streaming/meeting/ltu-hbsq-ljk';
    const cobroadcasterUrl = 'https://participant.app.100ms.live/streaming/meeting/kla-pfjb-iqi';
    const vnrtUrl = 'https://participant.app.100ms.live/streaming/meeting/zlf-cfqp-lde';
    const vrtUrl = 'https://participant.app.100ms.live/streaming/meeting/krn-ixnf-bsl';

    const broadcast = await context.newPage();
    await broadcast.goto(broadcasterUrl);
    await broadcast.getByPlaceholder('Enter name').fill('b1');
    await broadcast.getByText("Join Now").click();
    
    const cobroadcast1 = await context.newPage();
    await cobroadcast1.goto(cobroadcasterUrl);
    await cobroadcast1.getByPlaceholder('Enter name').fill('cb1');
    await cobroadcast1.getByText("Join Now").click();

    const cobroadcast2 = await context.newPage();
    await cobroadcast2.goto(cobroadcasterUrl);
    await cobroadcast2.getByPlaceholder('Enter name').fill('cb2');
    await cobroadcast2.getByText("Join Now").click();


    const vnrt1 = await context.newPage();
    await vnrt1.goto(vnrtUrl);
    await vnrt1.getByPlaceholder('Enter name').fill('vnrt1');
    await vnrt1.getByText("Join Now").click();


    const vnrt2 = await context.newPage();
    await vnrt2.goto(vnrtUrl);
    await vnrt2.getByPlaceholder('Enter name').fill('vnrt2');
    await vnrt2.getByText("Join Now").click();

    const vnrt3 = await context.newPage();
    await vnrt3.goto(vnrtUrl);
    await vnrt3.getByPlaceholder('Enter name').fill('vnrt3');
    await vnrt3.getByText("Join Now").click();

    const vrt1 = await context.newPage();
    await vrt1.goto(vrtUrl);
    await vrt1.getByPlaceholder('Enter name').fill('vrt1');
    await vrt1.getByText("Join Now").click();

    const vrt2 = await context.newPage();
    await vrt2.goto(vrtUrl);
    await vrt2.getByPlaceholder('Enter name').fill('vrt2');
    await vrt2.getByText("Join Now").click();

    const vrt3 = await context.newPage();
    await vrt3.goto(vrtUrl);
    await vrt3.getByPlaceholder('Enter name').fill('vrt3');
    await vrt3.getByText("Join Now").click();

    //check for broadcaster
    await broadcast.bringToFront();
    await broadcast.getByTestId("participant_list").click();
    await broadcast.getByText("Participant (9)").isVisible();
    await broadcast.getByText("Broadcaster (1)").isVisible();
    await broadcast.getByText("Co-Broadcaster (2)").isVisible();
    await broadcast.getByText("Viewer-Realtime (3)").isVisible();
    await broadcast.getByText("Viewer-Near-Realtime (3)").isVisible();


    await cobroadcast1.bringToFront();
    await broadcast.getByTestId("participant_list").click();
    await broadcast.getByText("Participant (9)").isVisible();
    await broadcast.getByText("Broadcaster (1)").isVisible();
    await broadcast.getByText("Co-Broadcaster (2)").isVisible();
    await broadcast.getByText("Viewer-Realtime (3)").isVisible();
    await broadcast.getByText("Viewer-Near-Realtime (3)").isVisible();

    await vnrt1.bringToFront();
    await vnrt1.getByTestId("participant_list").click();
    await vnrt1.getByText("Participant (9)").isVisible();
    await vnrt1.getByText("Broadcaster (1)").isVisible();
    await vnrt1.getByText("Co-Broadcaster (2)").isVisible();
    await vnrt1.getByText("Viewer-Realtime (3)").isVisible();
    await vnrt1.getByText("Viewer-Near-Realtime (3)").isVisible();

    await vrt1.bringToFront();
    await vrt1.getByTestId("participant_list").click();
    await vrt1.getByText("Participant (9)").isVisible();
    await vrt1.getByText("Broadcaster (1)").isVisible();
    await vrt1.getByText("Co-Broadcaster (2)").isVisible();
    await vrt1.getByText("Viewer-Realtime (3)").isVisible();
    await vrt1.getByText("Viewer-Near-Realtime (3)").isVisible();

    await broadcast.bringToFront();
    await broadcast.getByTestId('leave_end_dropdown_trigger').click();
    await broadcast.getByTestId('end_room_btn').click();
    await broadcast.getByTestId('stop_stream_btn').click();

});


test(`Verify participant search`, async({context}) => {

    const broadcasterUrl = 'https://participant.app.100ms.live/streaming/meeting/eqe-yolf-czn';
    const cobroadcasterUrl = 'https://participant.app.100ms.live/streaming/meeting/ohz-ugim-zpu';

    const broadcast = await context.newPage();
    await broadcast.goto(broadcasterUrl);
    await broadcast.getByPlaceholder('Enter name').fill('broadcaster');
    await broadcast.getByText("Join Now").click();

    const cobroadcast = await context.newPage();
    await cobroadcast.goto(cobroadcasterUrl);
    await cobroadcast.getByPlaceholder('Enter name').fill('cobro1');
    await cobroadcast.getByText("Join Now").click();

    const cobroadcast2 = await context.newPage();
    await cobroadcast2.goto(cobroadcasterUrl);
    await cobroadcast2.getByPlaceholder('Enter name').fill('cobro2');
    await cobroadcast2.getByText("Join Now").click();

    await broadcast.bringToFront();
    await broadcast.getByTestId("participant_list").click();
    await broadcast.locator("//input[@type='text']").fill("broadcaster");
    await broadcast.getByText("Broadcaster (1)")

    await broadcast.locator("//input[@type='text']").fill("cobro");
    await broadcast.getByText("Co-Broadcaster (2)")

    await broadcast.locator("//input[@type='text']").fill("cobro1");
    await broadcast.getByText("Co-Broadcaster (1)")

});