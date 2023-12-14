import { test } from '@playwright/test';
import { Selectors } from '../selectors/Selectors';
import { PageActions } from '../PageActions';

const URL = 'https://automation2.app.100ms.live/meeting/lnt-vqbj-sxl';

let selectors = new Selectors();
let pageActions = new PageActions();

test.beforeEach(async () => {});

test.afterEach(async  ({ page: nativePage })  => {
    await pageActions.endSession(nativePage);
});


  test(`User is start/stop browser recording`, async ({ page: nativePage }) => {
    console.log(`URL - `, URL);
    await nativePage.goto(URL);
    await pageActions.joinRoom(nativePage, 'Automation User');
    await nativePage.getByTestId('participant_video_tile').isVisible();
    await nativePage.getByText(selectors.StartRec).click();
    await pageActions.stopRecording(nativePage);
    await nativePage.getByText(selectors.StartRec).isVisible();
  });
