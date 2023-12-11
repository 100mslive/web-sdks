// eslint-disable-line
/* eslint-disable */
import { test } from '@playwright/test';

const hostUrl = 'https://role-limit-check.app.100ms.live/meeting/ifb-edpm-pcv';
const JoinBtn = 'Join Now';

test.beforeEach(async () => {});

test.afterEach(async ({ context }) => {
    await context.close();
});


test(`Verify role limit is working fine-LIVE-1724`, async ({ context }) => {
    const page_host = await context.newPage();
        await page_host.goto(hostUrl);
        await page_host.getByPlaceholder('Enter name').fill('host 1');
        await page_host.getByText(JoinBtn).click();
        await page_host.waitForTimeout(5000);

        const page_host2 = await context.newPage();
        await page_host2.goto(hostUrl);
        await page_host2.getByPlaceholder('Enter name').fill('host 2');
        await page_host2.getByText(JoinBtn).click();
        await page_host2.waitForTimeout(5000);

        const page = await context.newPage();
        await page.goto(hostUrl);
});