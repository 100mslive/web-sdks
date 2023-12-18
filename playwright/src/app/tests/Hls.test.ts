// eslint-disable-line
/* eslint-disable */
import { request, test,expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

test.beforeEach(async () => {});

test.afterEach(async ({ context }) => {
    await context.close();
});


test(`Verify play and pause recording for hls via API @hls`, async({context}) => {
    const broadcasterUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/rtc-qzif-int';
    const viewerNRTUrl = 'https://automation-live-stream.app.100ms.live/streaming/meeting/lqv-fdww-qyu';
    const room_id = '657fdd247811c6f89a7995aa';
    var mtoken: string | null=null;

    //Get managemnet token
    var jwt = require('jsonwebtoken');

    var app_access_key = '641833fba6951482ad80c6a3';
    var app_secret = 'ojdwZLsDI_FqpmUipJULMK8mfRhAiVQpXMNEay0ddIeXY7uVJZQiExyyUFKLt5_GM1EZSrsjvoal8UVDSSYMVItATfShp5LBbdUJwbPoUpOmXTtXRbcC70Gpv9qgnoTemTRRSXUTzxLcSGp8ZZZ1XBV4YKwkIbRdYuRp67G7uJk=';
    var payload = {
        access_key: app_access_key,
        type: 'management',
        version: 2,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000)
    };

    jwt.sign(
        payload,
        app_secret,
        {
            algorithm: 'HS256',
            expiresIn: '24h',
            jwtid: uuidv4()
        },
        function (err:any,token: any) {
            mtoken = token;
            //console.log(mtoken);
        }
    );

    const page_host = await context.newPage();

    //Join as broadcaster
    await page_host.goto(broadcasterUrl);
    await page_host.getByPlaceholder('Enter name').fill('broadcaster');
    await page_host.getByText("Go Live").click();
    await page_host.waitForTimeout(10000);

    //Join as vnrt
    const page = await context.newPage();
    await page.goto(viewerNRTUrl);
    await page.getByPlaceholder('Enter name').fill('vnrt');
    await page.getByText("Join Now").click();
    await page.waitForTimeout(5000);

    //Get stream id
    const api_context = await request.newContext();

    const resp = await api_context.get('https://api.100ms.live/v2/live-streams?room_id=657fdd247811c6f89a7995aa',{
        headers: {
          'Authorization': `Bearer `+mtoken
        }
      });
    const respbody = JSON.parse(await resp.text());  
    console.log(respbody);
    const stream_id = respbody.data[0].id;
    console.log("Stream id is "+stream_id);

    //Send pause
    const resp_pause = await api_context.post('https://api.100ms.live/v2/live-streams/'+stream_id+'/pause-recording',{
        headers: {
          'Authorization': `Bearer `+mtoken
        }
      });
      await page.waitForTimeout(2000);
      console.log("Status is ==> ",await resp_pause.status());

    // Verify on vnrt
    const count  = await page.locator("//div[@data-testid='header']/div/div[2]/div/div/div").count();
    await expect.soft(count).toEqual(3);

    //Send resume
    const resp_resume = await api_context.post('https://api.100ms.live/v2/live-streams/'+stream_id+'/resume-recording',{
        headers: {
          'Authorization': `Bearer `+mtoken
        }
      });
      console.log("Status is ==> ",await resp_resume.status());
    await page.waitForTimeout(2000);

    // Verify on vnrt
    const count1  = await page.locator("//div[@data-testid='header']/div/div[2]/div/div/div").count();
    await expect.soft(count1).toEqual(2);

    await page_host.bringToFront();
    await page_host.getByTestId('leave_end_dropdown_trigger').click();
    await page_host.getByTestId('end_room_btn').click();
    await page_host.getByTestId('stop_stream_btn').click();
});