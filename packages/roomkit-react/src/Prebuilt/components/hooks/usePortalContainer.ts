import { useHMSPrebuiltContext } from '../../AppContext';

export const usePortalContainer = () => {
  const { containerID } = useHMSPrebuiltContext();
  return containerID ? document.getElementById(`#${containerID}`) : undefined;
};
