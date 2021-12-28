import { keyframes } from '../stitches.config';

export const dialogOpen = keyframes({
  '0%': { opacity: 0, transform: 'translate(-50%, -48%) scale(.90)' },
  '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
});

export const dialogClose = keyframes({
  '0%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
  '100%': { opacity: 0, transform: 'translate(-50%, -48%) scale(.90)' },
});
