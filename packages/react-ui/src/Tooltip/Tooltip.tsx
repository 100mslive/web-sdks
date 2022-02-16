import { keyframes } from '@stitches/react';
import * as BaseTooltip from '@radix-ui/react-tooltip';
import React, { PropsWithChildren } from 'react';
import { styled } from '../Theme';

// TODO: move all keyframes in different file similiar to `styles.ts`
const slideUpAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateY(-2px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
});

const slideRightAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateX(-2px)' },
  '100%': { opacity: 1, transform: 'translateX(0)' },
});

const slideDownAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateY(2px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
});

const slideLeftAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateX(2px)' },
  '100%': { opacity: 1, transform: 'translateX(0)' },
});

const TooltipBox = styled(BaseTooltip.Content, {
  borderRadius: '$0',
  padding: '$3 $4',
  fontSize: '$xs',
  color: '$white',
  backgroundColor: '$grayDefault',
  '@media (prefers-reduced-motion: no-preference)': {
    animationDuration: '400ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'transform, opacity',
    '&[data-state="delayed-open"]': {
      '&[data-side="top"]': { animationName: slideDownAndFade },
      '&[data-side="right"]': { animationName: slideLeftAndFade },
      '&[data-side="bottom"]': { animationName: slideUpAndFade },
      '&[data-side="left"]': { animationName: slideRightAndFade },
    },
  },
});

// TODO: refactor this to adjust more props and composing
// TODO: also handle <kbd></kbd> inputs
export const Tooltip: React.FC<PropsWithChildren<{ title: string }>> = ({ children, title }) => (
  <BaseTooltip.Root delayDuration={200}>
    <BaseTooltip.Trigger asChild>{children}</BaseTooltip.Trigger>
    <TooltipBox sideOffset={10} side="top">
      {title}
    </TooltipBox>
  </BaseTooltip.Root>
);
