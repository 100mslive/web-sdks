import { blurBackground } from '../src';

describe('importing', () => {
  it('works', async () => {
    await expect(blurBackground({background:"blur", localStream: true})).toBeTruthy()
  });
});
