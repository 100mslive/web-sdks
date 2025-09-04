// Animation names from panda.config.ts keyframes
export const slideDown = 'slideDown';
export const slideUp = 'slideUp';
export const dialogOpen = 'dialogOpen';
export const dialogClose = 'dialogClose';
export const sheetSlideIn = 'sheetSlideIn';
export const sheetSlideOut = 'sheetSlideOut';
export const sheetFadeIn = 'sheetFadeIn';
export const sheetFadeOut = 'sheetFadeOut';
export const slideUpAndFade = 'slideUpAndFade';
export const slideRightAndFade = 'slideRightAndFade';
export const slideDownAndFade = 'slideDownAndFade';
export const slideLeftAndFade = 'slideLeftAndFade';
export const slideLeftAndFadeOut = 'slideLeftAndFadeOut';

// For translateAcross, we'll need to use inline styles since it's dynamic
export const translateAcross = ({ xFrom = '0', yFrom = '0', zFrom = '0', xTo = '0', yTo = '0', zTo = '0' }) => ({
  '@keyframes translateAcross': {
    from: { transform: `translate3d(${xFrom}, ${yFrom}, ${zFrom})` },
    to: { transform: `translate3d(${xTo}, ${yTo}, ${zTo})` },
  },
  animation: 'translateAcross',
});

export const popoverAnimation = {
  '@media (prefers-reduced-motion: no-preference)': {
    animationDuration: '400ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'transform, opacity',
    '&[data-state="open"]': {
      '&[data-side="top"]': { animationName: 'slideDownAndFade' },
      '&[data-side="right"]': { animationName: 'slideLeftAndFade' },
      '&[data-side="bottom"]': { animationName: 'slideUpAndFade' },
      '&[data-side="left"]': { animationName: 'slideRightAndFade' },
    },
  },
};

export const toastAnimation = {
  '@media (prefers-reduced-motion: no-preference)': {
    animationDuration: '500ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'transform, opacity',
    animationName: 'slideLeftAndFadeOut',

    '&[data-state="open"]': {
      animationName: 'slideRightAndFade',
    },
    '&[data-swipe="move"]': {
      transform: 'translateX(var(--radix-toast-swipe-move-x))',
    },
    '&[data-swipe="cancel"]': {
      transform: 'translateX(0)',
      transition: 'transform 200ms ease-out',
    },
    '&[data-swipe="end"]': {
      animation: 'slideLeftAndFadeOut 100ms ease-out forwards',
    },
  },
};
