import { test } from '@playwright/test';
import { Selectors } from '../selectors/Selectors';
import { PageActions } from '../PageActions';

const URL = 'https://automation-live-stream.app.100ms.live/streaming/meeting/vtf-ypzy-swn';
const VNRT_URL = 'https://automation-live-stream.app.100ms.live/streaming/meeting/vat-suuw-twk'; 

let selectors = new Selectors();
let pageActions = new PageActions();

test.beforeEach(async () => {});


  test(`User is able to create new Poll and Viewers can vote.`, async ({ context }) => {
    console.log(`URL - `, URL);
    const broadcaster_page = await context.newPage();
    await broadcaster_page.goto(URL);
    await pageActions.goLive(broadcaster_page, 'Automation User');
    await broadcaster_page.getByTestId('participant_video_tile').isVisible();

    // new poll assertions
    await broadcaster_page.getByText('Live').isVisible();
    await broadcaster_page.getByText(selectors.EndPollBtn).isVisible();
    await broadcaster_page.getByText('Automation User started a new poll');
  

    await pageActions.createNewPollorQuiz(true, 'Test Poll', broadcaster_page);


    const vnrt_page = await context.newPage();
    await vnrt_page.goto(VNRT_URL);
    await vnrt_page.getByPlaceholder('Enter name').fill('VNRT viewer');
    await vnrt_page.getByText(selectors.JoinBtn).click();
    await pageActions.vote(vnrt_page, false);

    await vnrt_page.getByText('Voted').isVisible();
    await broadcaster_page.bringToFront();
    await broadcaster_page.getByText(selectors.EndPollBtn).click();
    await broadcaster_page.getByText('Ended').isVisible();
    await broadcaster_page.getByText('1 Vote').isVisible();
    await pageActions.endSession(broadcaster_page);
    
  });

  test(`User is able to create new Quiz and Viewers can vote`, async ({ context }) => {
    console.log(`URL - `, URL);
    const broadcaster_page = await context.newPage();
    await broadcaster_page.goto(URL);
    await pageActions.goLive(broadcaster_page, 'Automation User');
    await broadcaster_page.getByTestId('participant_video_tile').isVisible();

    // new quiz assertions
    await broadcaster_page.getByText('Live').isVisible();
    await broadcaster_page.getByText(selectors.EndQuizBtn).isVisible();
    await broadcaster_page.getByText('Automation User started a new quiz');
  

    await pageActions.createNewQuiz('Test Poll', broadcaster_page);


    const vnrt_page = await context.newPage();
    await vnrt_page.goto(VNRT_URL);
    await vnrt_page.getByPlaceholder('Enter name').fill('VNRT viewer');
    await vnrt_page.getByText(selectors.JoinBtn).click();
    await pageActions.vote(vnrt_page, true);

    await vnrt_page.getByText('Answered').isVisible();
    await broadcaster_page.bringToFront();
    await broadcaster_page.getByText(selectors.EndQuizBtn).click();
    await broadcaster_page.getByText('Ended').isVisible();
    await broadcaster_page.getByText('1 Vote').isVisible();
    await broadcaster_page.getByText('View Leaderboard').isVisible();
    await pageActions.endSession(broadcaster_page);
  });