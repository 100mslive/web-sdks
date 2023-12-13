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


test(`Verify viewer is not getting removed from peer list on raising hand-LIVE-173`, async ({ context }) => {

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

        await page_host.bringToFront();
        await page_host.getByTestId('leave_end_dropdown_trigger').click();
        await page_host.getByTestId('end_room_btn').click();
        await page_host.getByTestId('stop_stream_btn').click();

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
        await page.waitForTimeout(5000);

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

        await page_host.getByTestId('leave_end_dropdown_trigger').click();
        await page_host.getByTestId('end_room_btn').click();
        await page_host.getByTestId('stop_stream_btn').click();
});

test(`Verify HLS starts on room-LIVE-1856`,async ({ context }) => {
        const broadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/phc-vxhk-bvz';
        const viewerNRTUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/dhl-gywb-xyc';

        const page_host = await context.newPage();

        //Join as broadcaster
        await page_host.goto(broadcasterUrl);
        await page_host.getByPlaceholder('Enter name').fill('broadcaster');
        await page_host.getByText("Go Live").click();
        await page_host.waitForTimeout(10000);

        await page_host.getByTestId('header').getByText('LIVE').isVisible();

        //Join as vnrt
        const page = await context.newPage();
        await page.goto(viewerNRTUrl);
        await page.getByPlaceholder('Enter name').fill('vnrt');
        await page.getByText(JoinBtn).click();
        await page.waitForTimeout(5000);

        //Check if live status is shown or not
        await page.getByTestId('header').getByText('LIVE').isVisible();
        const player = page.locator("//div[@data-testid='hms-video']//video");
        await player.isVisible();

        await page.getByTestId('leave_room_btn').click();
        await page.getByTestId('leave_room').click();

        await page.getByTestId('join_again_btn').isVisible();

        await page_host.bringToFront();
        await page_host.getByTestId('leave_end_dropdown_trigger').click();
        await page_host.getByTestId('end_room_btn').click();
        await page_host.getByTestId('stop_stream_btn').click();
});

test(`Verify Webrtc viewer can join room and leave`, async({context}) => {
        const cobroadcaster = 'https://automation-live-stream.app.100ms.live/streaming/meeting/lni-ylib-xho';
        const webrtcviewer = 'https://automation-live-stream.app.100ms.live/streaming/meeting/vfi-zkyi-gzj';

        const page_host = await context.newPage();

        //Join as broadcaster
        await page_host.goto(cobroadcaster);
        await page_host.getByPlaceholder('Enter name').fill('co-broadcaster');
        await page_host.getByText("Join Now").click();
        await page_host.waitForTimeout(5000);
 
 
        //Join as vnrt
        const page = await context.newPage();
        await page.goto(webrtcviewer);
        await page.getByPlaceholder('Enter name').fill('vrt');
        await page.getByText(JoinBtn).click();
        await page.waitForTimeout(5000);

        await page.getByTestId('participant_video_tile').isVisible();
        await page.getByTestId('leave_room_btn').click();
        await page.getByTestId('leave_room').click();

        await page.getByTestId('join_again_btn').isVisible();
        await page.getByTestId('join_again_btn').click();

        await page.getByPlaceholder('Enter name').fill('vrt');
        await page.getByText(JoinBtn).click();
        await page.waitForTimeout(5000);

        await page.getByTestId('participant_video_tile').isVisible();
});

test(`Verify co-broadcaster can end room`, async({context}) => {
        const cobroadcaster = 'https://automation-live-stream.app.100ms.live/streaming/meeting/lni-ylib-xho';
        const webrtcviewer = 'https://automation-live-stream.app.100ms.live/streaming/meeting/vfi-zkyi-gzj';

        const page_host = await context.newPage();

         //Join as broadcaster
         await page_host.goto(cobroadcaster);
         await page_host.getByPlaceholder('Enter name').fill('co-broadcaster');
         await page_host.getByText("Join Now").click();
         await page_host.waitForTimeout(5000);
  
  
         //Join as vnrt
         const page = await context.newPage();
         await page.goto(webrtcviewer);
         await page.getByPlaceholder('Enter name').fill('vrt');
         await page.getByText(JoinBtn).click();
         await page.waitForTimeout(5000);

        await page_host.bringToFront();
        await page_host.getByTestId('leave_end_dropdown_trigger').click();
        await page_host.getByTestId('end_room_btn').click();
        await page_host.getByTestId('stop_stream_btn').click(); 

        await page_host.getByTestId('join_again_btn').isVisible();

        await page.bringToFront();
        await page.getByTestId('join_again_btn').isVisible();
});

test(`Verify broadcaster can end the session`, async({context}) => {
        const broadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/hih-ovsh-xru';
        const viewerNRTUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/eqe-gdip-nyp';

        const page_host = await context.newPage();

        //Join as broadcaster
        await page_host.goto(broadcasterUrl);
        await page_host.getByPlaceholder('Enter name').fill('broadcaster');
        await page_host.getByText("Go Live").click();
        await page_host.waitForTimeout(10000);
 
        await page_host.getByTestId('header').getByText('LIVE').isVisible();

        const page_host2 = await context.newPage();

        //Join as broadcaster
        await page_host2.goto(broadcasterUrl);
        await page_host2.getByPlaceholder('Enter name').fill('broadcaster2');
        await page_host2.getByText("Join Now").click();
        await page_host2.waitForTimeout(5000);
 
        //Join as vnrt
        const page = await context.newPage();
        await page.goto(viewerNRTUrl);
        await page.getByPlaceholder('Enter name').fill('vnrt');
        await page.getByText(JoinBtn).click();
        await page.waitForTimeout(5000);

        await page_host.bringToFront();
        await page_host.getByTestId('leave_end_dropdown_trigger').click();
        await page_host.getByTestId('end_room_btn').click();
        await page_host.getByTestId('stop_stream_btn').click(); 
        await page.waitForTimeout(1000);

        await page_host2.bringToFront();
        await page_host2.getByTestId('leave_end_dropdown_trigger').click();
        await page_host2.getByTestId('end_room_btn').click();
        await page_host2.getByTestId('stop_stream_btn').click(); 
        await page.waitForTimeout(1000);
        
        await page.bringToFront();
        await page.getByTestId('join_again_btn').isVisible();
});

test(`Verify broadcaster and co-broadcaster can leave and rejoin room` , async({context}) => {

        const broadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/hih-ovsh-xru';
        const cobroadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/adg-mwom-fcm';

        const page_host = await context.newPage();

        //Join as broadcaster
        await page_host.goto(broadcasterUrl);
        await page_host.getByPlaceholder('Enter name').fill('broadcaster');
        await page_host.getByText("Go Live").click();
        await page_host.waitForTimeout(10000);
 
        await page_host.getByTestId('header').getByText('LIVE').isVisible();

        const page_host2 = await context.newPage();

        //Join as co-broadcaster
        await page_host2.goto(cobroadcasterUrl);
        await page_host2.getByPlaceholder('Enter name').fill('co-broadcaster');
        await page_host2.getByText("Join Now").click();
        await page_host2.waitForTimeout(2000);
        
        await page_host2.getByTestId('leave_room_btn').click();
        await page_host2.getByTestId('leave_room').click();

        await page_host2.getByTestId('join_again_btn').isVisible();
        await page_host2.getByTestId('join_again_btn').click();

        await page_host2.getByPlaceholder('Enter name').fill('co-broadcaster');
        await page_host2.getByText("Join Now").click();
        await page_host2.waitForTimeout(1000);
        await page_host2.getByTestId('header').getByText('LIVE').isVisible();

        await page_host.bringToFront();
        await page_host.getByTestId('leave_room_btn').click();
        await page_host.getByTestId('leave_room').click();

        await page_host.getByTestId('join_again_btn').isVisible();
        await page_host.getByTestId('join_again_btn').click();

        await page_host.getByPlaceholder('Enter name').fill('broadcaster');
        await page_host.getByText("Go Live").click();
        await page_host.waitForTimeout(10000);
 
        await page_host.getByTestId('header').getByText('LIVE').isVisible();

        await page_host.getByTestId('leave_end_dropdown_trigger').click();
        await page_host.getByTestId('end_room_btn').click();
        await page_host.getByTestId('stop_stream_btn').click();
        
});

test(`Verify hls viewer can join room and leave`, async({context}) => {
        const broadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/hih-ovsh-xru';
        const hlsviewerUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/eqe-gdip-nyp';

        const page_host = await context.newPage();

        //Join as broadcaster
        await page_host.goto(broadcasterUrl);
        await page_host.getByPlaceholder('Enter name').fill('broadcaster');
        await page_host.getByText("Go Live").click();
        await page_host.waitForTimeout(5000);
 
        //Join as vnrt
        const page = await context.newPage();
        await page.goto(hlsviewerUrl);
        await page.getByPlaceholder('Enter name').fill('vnrt');
        await page.getByText(JoinBtn).click();
        await page.waitForTimeout(5000);

        await page.getByTestId('hms-video').isVisible();
        await page.getByTestId('leave_room_btn').click();
        await page.getByTestId('leave_room').click();

        await page.getByTestId('join_again_btn').isVisible();
        await page.getByTestId('join_again_btn').click();

        await page.getByPlaceholder('Enter name').fill('vnrt');
        await page.getByText(JoinBtn).click();
        await page.waitForTimeout(5000);

        await page.getByTestId('hms-video').isVisible();
        await page_host.bringToFront();
        await page_host.getByTestId('leave_end_dropdown_trigger').click();
        await page_host.getByTestId('end_room_btn').click();
        await page_host.getByTestId('stop_stream_btn').click();
});


test(`Verify on-stage can join room and leave`, async({context}) => {
        const broadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/hih-ovsh-xru';
        const hlsviewerUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/eqe-gdip-nyp';

        const page_host = await context.newPage();

        //Join as broadcaster
        await page_host.goto(broadcasterUrl);
        await page_host.getByPlaceholder('Enter name').fill('broadcaster');
        await page_host.getByText("Go Live").click();
        await page_host.waitForTimeout(5000);
 
        //Join as vnrt
        const page = await context.newPage();
        await page.goto(hlsviewerUrl);
        await page.getByPlaceholder('Enter name').fill('vnrt');
        await page.getByText(JoinBtn).click();
        await page.waitForTimeout(5000);

        await page.getByTestId('hms-video').isVisible();

         //Hand raise for vnrt
         await page.getByTestId('hand_raise_btn').click();
         await page.waitForTimeout(2000);
 
         //Go to broadcaster and click brint to stage notification
         await page_host.bringToFront();
         await page_host.getByText('Bring to stage').click();
 
         //Accpet invite
         await page.bringToFront();
         await page.getByText('Accept').click();
         await page.waitForTimeout(5000);

        await page.getByTestId('leave_room_btn').click();
        await page.getByTestId('leave_room').click();

        await page.getByTestId('join_again_btn').isVisible();
        await page.getByTestId('join_again_btn').click();

        await page.getByPlaceholder('Enter name').fill('vnrt');
        await page.getByText(JoinBtn).click();
        await page.waitForTimeout(5000);

        await page.getByTestId('hms-video').isVisible();

        await page_host.bringToFront();
        await page_host.getByTestId('leave_end_dropdown_trigger').click();
        await page_host.getByTestId('end_room_btn').click();
        await page_host.getByTestId('stop_stream_btn').click();
});


test(`Verify stream is running in highest quality`, async({context}) => {

        const broadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/hih-ovsh-xru';
        const hlsviewerUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/eqe-gdip-nyp';

        const page_host = await context.newPage();

        //Join as broadcaster
        await page_host.goto(broadcasterUrl);
        await page_host.getByPlaceholder('Enter name').fill('broadcaster');
        await page_host.getByText("Go Live").click();
        await page_host.waitForTimeout(5000);
 
        //Join as vnrt
        const page = await context.newPage();
        await page.goto(hlsviewerUrl);
        await page.getByPlaceholder('Enter name').fill('vnrt');
        await page.getByText(JoinBtn).click();
        await page.waitForTimeout(5000);

        await page.getByTestId('hms-video').isVisible();
        await page.getByTestId('hms-video').hover();
        
        page.locator("//div[@data-testid='quality_selector']//p[contains(.,'720')]").isVisible();
        await page_host.bringToFront();
        await page_host.getByTestId('leave_end_dropdown_trigger').click();
        await page_host.getByTestId('end_room_btn').click();
        await page_host.getByTestId('stop_stream_btn').click();
});

test(`Verify peer can remove other peer`, async({context}) => {
        const broadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/hih-ovsh-xru';
        const hlsviewerUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/eqe-gdip-nyp';

        const page_host = await context.newPage();

        //Join as broadcaster
        await page_host.goto(broadcasterUrl);
        await page_host.getByPlaceholder('Enter name').fill('broadcaster');
        await page_host.getByText("Go Live").click();
        await page_host.waitForTimeout(5000);
 
        //Join as vnrt
        const page = await context.newPage();
        await page.goto(hlsviewerUrl);
        await page.getByPlaceholder('Enter name').fill('vnrt');
        await page.getByText(JoinBtn).click();
        await page.waitForTimeout(2000);
        
        await page_host.bringToFront();
        await page_host.getByTestId('participant_list').click();
        await page_host.locator("//div[contains(@id,'Participants')]//h3[contains(.,'viewer-near-realtime')]").click();

        await page_host.getByTestId('participant_vnrt').hover();
        const peer_menu = page_host.locator("//div[@data-testid='participant_vnrt']//div[@data-testid='participant_more_actions']");
        await peer_menu.click();
        await page_host.getByText('Remove Participant').click();

        await page.bringToFront();
        await page.getByTestId('join_again_btn').isVisible();

});



