import { Selectors } from "./selectors/Selectors";

let selectors = new Selectors();
export class PageActions {

    async endSession(page: any) {
        await page.getByTestId(selectors.DropDown).click();
        await page.getByTestId(selectors.EndSessionOption).click();
        await page.getByTestId(selectors.EndSession).click();
    }

    async stopRecording(page: any) {
        await page.getByText(selectors.StopRec).click();
        await page.getByText(selectors.StopRecConfirmText).isVisible();
        await page.getByTestId(selectors.StopRecButton).click();
    }

    async joinRoom(page: any, name: string) {
        await page.getByPlaceholder('Enter name').fill(name);
        await page.getByText(selectors.JoinBtn).click();
        await page.waitForTimeout(2000);
    }

    async goLive(page: any, name: string) {
        await page.getByPlaceholder('Enter name').fill(name);
        await page.getByText(selectors.GoLive).click();
        await page.waitForTimeout(2000);
    }

    async createNewPoll(name: string, page:any) {
        await page.getByTestId(selectors.PollsMenuBtn).click();
        await page.locator(selectors.PollName).fill(name);
        await page.getByText(selectors.CreatePollBtn).click();
        await page.getByPlaceholder(selectors.QuestionName).fill('question no 1');
        await page.getByPlaceholder('Option 1').fill('Option1');
        await page.getByPlaceholder('Option 2').fill('Option2');
        await page.getByText('Save').click();
        await page.getByText(selectors.LaunchPollBtn).click();
    }

    async createNewQuiz(name: string, page:any) {
        await page.getByTestId(selectors.PollsMenuBtn).click();
        await page.getByText('Quiz').nth(1).click();
        await page.locator(selectors.QuizName).fill(name);
        await page.getByText(selectors.CreateQuizBtn).click();
        await page.getByPlaceholder(selectors.QuestionName).fill('question no 1');
        await page.getByPlaceholder('Option 1').fill('Option1');
        await page.getByPlaceholder('Option 2').fill('Option2');
        await page.locator('button[role=radio]').nth(1).click();
        await page.getByText('Save').click();
        await page.getByText(selectors.LaunchQuizBtn).click();
    }
    async vote(page: any, isQuiz: boolean) {
        await page.getByTestId(selectors.PollsMenuBtn).click();
        await page.getByText('View').click();
        await page.locator('button[role=radio]').nth(1).click();
        if(isQuiz) 
           await page.getByText(selectors.AnswerBtn).click();
        else
        await page.getByText(selectors.VoteBtn).click();
    }

    async turnOnStatsForNerds(page: any){
        await page.getByTestId(selectors.MoreSettingsBtn).click();
        await page.getByText(selectors.StatsForNerdsMenu).click();
        await page.locator(selectors.ShowStatsBtn).click();
        await page.getByTestId(selectors.StatsForNerdsCloseBtn).click();
    }
}
