/**
 * Add __cancel-drag-event for the menu to open on touch devices on the draggdable element
 *
 */
export const getDragClassName = () => {
  return navigator?.maxTouchPoints > 0 ? '__cancel-drag-event' : '';
};
