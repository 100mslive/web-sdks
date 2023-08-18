/**
 * Flex based centering helper styles
 */
export const flexCenter = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

/**
 * Gives styles for text ellipsis, with given width as maxWidth.
 * A number in pixels or css width string value can be passed
 * @param {number|string} width
 * @returns
 */
export const textEllipsis = (width: number | string) => ({
  maxWidth: width,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
});
