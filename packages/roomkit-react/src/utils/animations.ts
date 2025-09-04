import { keyframes } from '../styled-system';

export const slideDown = (controller: string) =>
  keyframes({
    from: { height: 0 },
    to: { height: `var(${controller})` },
  });

export const slideUp = (controller: string) =>
  keyframes({
    from: { height: `var(${controller})` },
    to: { height: 0 },
  });

export const translateAcross = ({ xFrom = '0', yFrom = '0', zFrom = '0', xTo = '0', yTo = '0', zTo = '0' }) =>
  keyframes({
    from: { transform: `translate3d(${xFrom}, ${yFrom}, ${zFrom})` },
    to: { transform: `translate3d(${xTo}, ${yTo}, ${zTo}` },
  });

export const dialogOpen = keyframes({
  '0%': { opacity: 0, transform: 'translate(-50%, -48%) scale(.90)' },
  '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
});

export const dialogClose = keyframes({
  '0%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
  '100%': { opacity: 0, transform: 'translate(-50%, -48%) scale(.90)' },
});

export const slideUpAndFade = (start = '2px') =>
  keyframes({
    '0%': { opacity: 0, transform: `translateY(${start})` },
    '100%': { opacity: 1, transform: 'translateY(0)' },
  });

export const slideRightAndFade = (start = '-2px') =>
  keyframes({
    '0%': { opacity: 0, transform: `translateX(${start})` },
    '100%': { opacity: 1, transform: 'translateX(0)' },
  });

export const sheetSlideIn = keyframes({
  from: { transform: '$$transformValue' },
  to: { transform: 'translate3d(0,0,0)' },
});

export const sheetSlideOut = keyframes({
  from: { transform: 'translate3d(0,0,0)' },
  to: { transform: '$$transformValue' },
});
export const sheetFadeIn = keyframes({
  from: { opacity: '0' },
  to: { opacity: '1' },
});

export const sheetFadeOut = keyframes({
  from: { opacity: '1' },
  to: { opacity: '0' },
});
export const slideDownAndFade = (start = '-2px') =>
  keyframes({
    '0%': { opacity: 0, transform: `translateY(${start})` },
    '100%': { opacity: 1, transform: 'translateY(0)' },
  });

export const slideLeftAndFade = (start = '2px') =>
  keyframes({
    '0%': { opacity: 0, transform: `translateX(${start})` },
    '100%': { opacity: 1, transform: 'translateX(0)' },
  });

const slideLeftAndFadeOut = (end = '-100%') =>
  keyframes({
    '0%': { opacity: 1, transform: `translateX(0)` },
    '100%': { opacity: 0, transform: `translateX(${end})` },
  });

export const popoverAnimation = {
  '@media (prefers-reduced-motion: no-preference)': {
    animationDuration: '400ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'transform, opacity',
    '&[data-state="open"]': {
      '&[data-side="top"]': { animationName: slideDownAndFade() },
      '&[data-side="right"]': { animationName: slideLeftAndFade() },
      '&[data-side="bottom"]': { animationName: slideUpAndFade() },
      '&[data-side="left"]': { animationName: slideRightAndFade() },
    },
  },
};

export const toastAnimation = {
  '@media (prefers-reduced-motion: no-preference)': {
    animationDuration: '500ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'transform, opacity',
    animationName: slideLeftAndFadeOut(),

    '&[data-state="open"]': {
      animationName: slideRightAndFade('-100%'),
    },
    '&[data-swipe="move"]': {
      transform: 'translateX(var(--radix-toast-swipe-move-x))',
    },
    '&[data-swipe="cancel"]': {
      transform: 'translateX(0)',
      transition: 'transform 200ms ease-out',
    },
    '&[data-swipe="end"]': {
      animation: `${slideLeftAndFadeOut()} 100ms ease-out forwards`,
    },
  },
};
