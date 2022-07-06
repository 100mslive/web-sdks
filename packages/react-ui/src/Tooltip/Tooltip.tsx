import * as BaseTooltip from '@radix-ui/react-tooltip';
import React, { PropsWithChildren } from 'react';
import { styled } from '../Theme';
import { slideDownAndFade, slideLeftAndFade, slideRightAndFade, slideUpAndFade } from '../utils';

const TooltipBox = styled(BaseTooltip.Content, {
  fontFamily: '$sans',
  borderRadius: '$2',
  padding: '$2 $4',
  fontSize: '$xs',

  color: '$textHighEmp',
  backgroundColor: '$surfaceLight',
  '@media (prefers-reduced-motion: no-preference)': {
    animationDuration: '400ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'transform, opacity',
    '&[data-state="delayed-open"]': {
      '&[data-side="top"]': { animationName: slideDownAndFade() },
      '&[data-side="right"]': { animationName: slideLeftAndFade() },
      '&[data-side="bottom"]': { animationName: slideUpAndFade() },
      '&[data-side="left"]': { animationName: slideRightAndFade() },
    },
  },
  variants: {
    outlined: {
      true: {
        backgroundColor: '$blackLight',
        border: 'solid $space$px $secondaryDark',
      },
    },
  },
});

const TooltipTrigger = styled(BaseTooltip.Trigger, {
  fontFamily: '$sans',
});

const TooltipRoot = BaseTooltip.Root;
export type alignTooltip = 'end' | 'center' | 'start' | undefined;
export type sideTooltip = 'bottom' | 'left' | 'right' | 'top' | undefined;

export const Tooltip: React.FC<
  PropsWithChildren<{ title: React.ReactNode | string; outlined?: boolean; side?: sideTooltip; align?: alignTooltip }>
> = ({ children, title, outlined = true, side = 'bottom', align = 'center' }) => (
  <TooltipRoot delayDuration={200}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipBox sideOffset={10} side={side} align={align} outlined={outlined}>
      {title}
    </TooltipBox>
  </TooltipRoot>
);
