export const getDragClassName = () => {
  return navigator?.maxTouchPoints > 0 ? '__cancel-drag-event' : '';
};
