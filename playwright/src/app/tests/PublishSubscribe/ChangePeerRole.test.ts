import { PageWrapper } from '../../PageWrapper';
import { test } from '@playwright/test';

test.skip(`Change peer Role`, async ({ context }) => {
  const pages = await PageWrapper.openPages(context, 2);

  for (let i = 0; i < pages[0].header.role_list.length; i++) {
    if (i === 2) {
      continue;
    }
    await pages[0].timeout(3000);
    await pages[0].click(pages[0].header.participant_list);
    await pages[0].timeout(3000);

    await pages[0].click(pages[0].header.participant_setting.replace('?', pages[1].localName));
    await pages[0].timeout(3000);

    await pages[0].click(pages[0].header.dialog_select_change_role_to);

    // await pages[0].clickWithTimeout(
    //   3000,
    //   pages[0].header.participant_list,
    //   pages[0].header.participant_setting.replace('?', pages[1].localName),
    //   pages[0].header.dialog_select_change_role_to,
    // );
    await pages[0].timeout(3000);

    await pages[0].click(pages[0].header.participant_dropdown);
    await pages[0].timeout(3000);
    await pages[0].click('div[data-testid=?]'.replace('?', pages[0].header.role_list[i]));

    await pages[1].timeout(2000);

    await pages[0].click(pages[0].center.dialog_change_button);

    //page2 check
    await pages[1].timeout(2000);
    await pages[1].click(pages[1].center.dialog_accept, pages[1].header.participant_list);
    await pages[1].assertVisible(pages[1].header.participant_role_heading.replace('?', pages[1].header.role_list[i]));
    await pages[1].click('html');
    await pages[1].timeout(2000);

    await pages[0].click(
      pages[0].header.participant_list,
      pages[0].header.participant_setting.replace('?', pages[1].localName),
      pages[0].header.dialog_select_change_role_to,
    );

    // await pages[0].selectPopupOption(pages[0].header.role_list[2]);
    await pages[0].click(pages[0].center.dialog_confirm);

    //page2 click Accept
    await pages[1].click(pages[1].center.dialog_accept);
  }

  await pages[0].endRoom();
  await context.close();
});
