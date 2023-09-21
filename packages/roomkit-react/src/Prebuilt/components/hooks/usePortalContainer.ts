import { useHMSPrebuiltContext } from '../../AppContext';

export const usePortalContainer = () => {
  const { dialogContainerSelector } = useHMSPrebuiltContext();
  return dialogContainerSelector ? (document.querySelector(dialogContainerSelector) as HTMLElement) : undefined;
};
