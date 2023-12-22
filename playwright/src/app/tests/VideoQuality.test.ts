
import { test, expect, Page } from '@playwright/test';
import { Selectors } from '../selectors/Selectors';
import { PageActions } from '../PageActions';


const selectors = new Selectors();
const pageActions = new PageActions();
let page_host: Page;

test.beforeEach(async () => {});

test.afterEach(async ({ context }) => {
    await page_host.bringToFront();
    await page_host.getByTestId('leave_end_dropdown_trigger').click();
    await page_host.getByTestId('end_room_btn').click();
    await page_host.getByTestId('stop_stream_btn').click();
    await context.close();
});

test('User should be able to subscribe to highest video quality in inset mode', async({context}) =>  {
    const hostUrl = 'https://sahil-videoconf-1501.app.100ms.live/meeting/sqw-exrv-qci';
    const guestUrl = 'https://sahil-videoconf-1501.app.100ms.live/meeting/auc-nvjm-sss';

    page_host = await context.newPage();

    //Join as host
    await page_host.goto(hostUrl);
    await page_host.getByPlaceholder('Enter name').fill('host');
    await page_host.getByText(selectors.JoinBtn).click();
    await page_host.waitForTimeout(2000);

    //Join as guest
    const page_guest = await context.newPage();
    await page_guest.goto(guestUrl);
    await page_guest.getByPlaceholder('Enter name').fill('guest');
    await page_guest.getByText(selectors.JoinBtn).click();
    await page_guest.waitForTimeout(2000);

    await pageActions.turnOnStatsForNerds(page_guest);
    await page_guest.waitForTimeout(2000);
    const table = await page_guest.locator('table').nth(0);
    const text = await table.locator('td').allInnerTexts();
    expect(text[0]).toEqual('Width');
    expect(text[1]).toEqual('1280');
    expect(text[2]).toEqual('Height');
    expect(text[3]).toEqual('720');

})


