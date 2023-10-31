import { useCallback } from 'react';
import { selectAppData, useHMSActions, useHMSStore, useHMSVanillaStore } from '@100mslive/react-sdk';
import { usePollViewState } from './useUISettings';
import { APP_DATA, POLL_STATE, POLL_VIEWS, SIDE_PANE_OPTIONS } from '../../common/constants';

/**
 * Gives a boolean value if the sidepaneType matches current sidepane value in store
 * @param {string} sidepaneType
 * @returns {boolean} - if the sidepaneType is passed returns boolean else the current value
 */
export const useIsSidepaneTypeOpen = sidepaneType => {
  if (!sidepaneType) {
    throw Error('Pass one of the side pane options');
  }
  return useHMSStore(selectAppData(APP_DATA.sidePane)) === sidepaneType;
};

/**
 * Gives the current value of sidepane in store
 * @returns {string} - if the sidepaneType is passed returns boolean else the current value
 */
export const useSidepaneState = () => {
  const sidePane = useHMSStore(selectAppData(APP_DATA.sidePane));
  return sidePane;
};

/**
 * Toggle the sidepane value between passed sidePaneType and '';
 * @param {string} sidepaneType
 */
export const useSidepaneToggle = sidepaneType => {
  const hmsActions = useHMSActions();
  const vanillaStore = useHMSVanillaStore();
  const toggleSidepane = useCallback(() => {
    const isOpen = vanillaStore.getState(selectAppData(APP_DATA.sidePane)) === sidepaneType;
    hmsActions.setAppData(APP_DATA.sidePane, !isOpen ? sidepaneType : '');
  }, [vanillaStore, hmsActions, sidepaneType]);
  return toggleSidepane;
};

export const usePollViewToggle = () => {
  const hmsActions = useHMSActions();
  const { view, setPollState } = usePollViewState();
  const isOpen = useSidepaneState() === SIDE_PANE_OPTIONS.POLLS;

  const togglePollView = useCallback(
    id => {
      id = typeof id === 'string' ? id : undefined;
      const newView = id ? POLL_VIEWS.VOTE : isOpen && view ? null : POLL_VIEWS.CREATE_POLL_QUIZ;
      setPollState({
        [POLL_STATE.pollInView]: id,
        [POLL_STATE.view]: newView,
      });
      hmsActions.setAppData(APP_DATA.sidePane, newView ? SIDE_PANE_OPTIONS.POLLS : '');
    },
    [hmsActions, view, setPollState, isOpen],
  );

  return togglePollView;
};

/**
 * resets the sidepane value
 */
export const useSidepaneReset = () => {
  const hmsActions = useHMSActions();
  const resetSidepane = useCallback(() => {
    hmsActions.setAppData(APP_DATA.sidePane, '');
    hmsActions.setAppData(APP_DATA.pollInView, '');
  }, [hmsActions]);
  return resetSidepane;
};
