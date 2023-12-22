import { test, expect } from '@playwright/test';
import { Selectors } from '../selectors/Selectors';


const selectors = new Selectors();
let page_host : any ;

test.beforeEach(async () => {});

test.afterEach(async ({ context }) => {
    await page_host.bringToFront();
    await page_host.getByTestId('leave_end_dropdown_trigger').click();
    await page_host.getByTestId('end_room_btn').click();
    await page_host.getByTestId('stop_stream_btn').click();
    await context.close();
});

test('Broadcaster is able to invite VNRT on stage with one click/force. @qaonly', async({context}) =>  {
    const broadcasterUrl = 'https://sahil-livestream-1207.app.100ms.live/streaming/meeting/sim-sbtw-svm';
    const hlsviewerUrl = 'https://sahil-livestream-1207.app.100ms.live/streaming/meeting/cfn-mafp-ewd';

    page_host = await context.newPage();

    //Join as broadcaster
    await page_host.goto(broadcasterUrl);
    await page_host.getByPlaceholder('Enter name').fill('broadcaster');
    await page_host.getByText(selectors.GoLive).click();
    await page_host.waitForTimeout(5000);

    //Join as vnrt
    const page = await context.newPage();
    await page.goto(hlsviewerUrl);
    await page.getByPlaceholder('Enter name').fill('vnrt');
    await page.getByText(selectors.JoinBtn).click();
    await page.waitForTimeout(5000);

    await page.getByTestId('hms-video').isVisible();

     //Hand raise for vnrt
     await page.getByTestId('hand_raise_btn').click();

     //Go to broadcaster and click brint to stage notification
     await page_host.bringToFront();
     await page_host.getByText('Bring to stage').click();

   
   // viewer on stage assertions for broadcaster

    await page_host.getByTestId('participant_avatar_icon').isVisible();
    await page_host.getByTestId('participant_audio_mute_icon').isVisible();
    await expect(page_host.locator('data-testid=participant_video_tile')).toHaveCount(2);

    // viewer on stage assertions for vnrt
    await page.bringToFront();

    await page.getByTestId('participant_avatar_icon').isVisible();
    await page.getByTestId('participant_audio_mute_icon').isVisible();
    await expect(page.locator('data-testid=participant_video_tile')).toHaveCount(2);
    await expect(page.locator('text=Live')).toHaveCount(2);

})

test('Broadcaster is able to invite VRT on stage with one click/force. @qaonly', async({context}) =>  {
    const broadcasterUrl = 'https://sahil-livestream-1207.app.100ms.live/streaming/meeting/sim-sbtw-svm';
    const hlsviewerUrl = 'https://sahil-livestream-1207.app.100ms.live/streaming/meeting/cbg-ojjo-usk';

    page_host = await context.newPage();
 
    //Join as broadcaster
    await page_host.goto(broadcasterUrl);
    await page_host.getByPlaceholder('Enter name').fill('broadcaster');
    await page_host.getByText(selectors.GoLive).click();
    await page_host.waitForTimeout(5000);

    //Join as vnrt
    const page = await context.newPage();
    await page.goto(hlsviewerUrl);
    await page.getByPlaceholder('Enter name').fill('vrt');
    await page.getByText(selectors.JoinBtn).click();
    await page.waitForTimeout(5000);

    await page.getByTestId('hms-video').isVisible();

     //Hand raise for vrt
     await page.getByTestId('hand_raise_btn').click();

     //Go to broadcaster and click brint to stage notification
     await page_host.bringToFront();
     await page_host.getByText('Bring to stage').click();

   
   // viewer on stage assertions for broadcaster

    await page_host.getByTestId('participant_avatar_icon').isVisible();
    await page_host.getByTestId('participant_audio_mute_icon').isVisible();
    await expect(page_host.locator('data-testid=participant_video_tile')).toHaveCount(2);

    // viewer on stage assertions for vnrt
    await page.bringToFront();

    await page.getByTestId('participant_avatar_icon').isVisible();
    await page.getByTestId('participant_audio_mute_icon').isVisible();
    await expect(page.locator('data-testid=participant_video_tile')).toHaveCount(2);
    
})
