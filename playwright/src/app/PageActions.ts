import { Selectors } from "./selectors/Selectors";

let selectors = new Selectors();
export class PageActions {

    async endSession(page: any) {
        await page.getByTestId(selectors.DropDown).click();
        await page.getByText(selectors.EndSessionOption).click();
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
}