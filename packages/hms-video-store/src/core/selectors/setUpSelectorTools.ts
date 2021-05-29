// reselect-tools doesn't have typescript types so suppress related error
// @ts-ignore
import { registerSelectors } from 'reselect-tools';

import * as selectors from './index';

let areSelectorsRegistered = false;

export const registerSelectorTools = () => {
  if (areSelectorsRegistered) {
    return;
  }
  areSelectorsRegistered = true;
  registerSelectors(selectors);
};
