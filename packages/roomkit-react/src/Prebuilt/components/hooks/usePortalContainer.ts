import { useHMSPrebuiltContext } from '../../AppContext';

export const usePortalContainer = () => {
  const { containerSelector } = useHMSPrebuiltContext();
  return containerSelector ? document.querySelector(containerSelector) : undefined;
};
