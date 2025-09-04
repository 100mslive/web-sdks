import React, { PropsWithChildren, useState } from 'react';
import * as BaseTooltip from '@radix-ui/react-tooltip';
import { cva, styled } from '../styled-system';
import { slideDownAndFade, slideLeftAndFade, slideRightAndFade, slideUpAndFade } from '../utils';

const tooltipBoxVariants = cva({
  base: {
    fontFamily: 'sans',
    borderRadius: 'token(radii.2)',
    padding: 'token(spacing.2) token(spacing.4)',
    fontSize: 'xs',
    zIndex: '11',
    color: 'onSurface.high',
    backgroundColor: 'surface.bright',
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
  },
  variants: {
    outlined: {
      true: {
        backgroundColor: 'background.dim',
        border: '1px solid token(colors.border.bright)',
      },
    },
  },
});

const TooltipBox = styled(BaseTooltip.Content, tooltipBoxVariants);

const TooltipTrigger = styled(BaseTooltip.Trigger, {
  base: {
    fontFamily: 'sans',
  },
});

const TooltipRoot = BaseTooltip.Root;
export type alignTooltip = 'end' | 'center' | 'start' | undefined;
export type sideTooltip = 'bottom' | 'left' | 'right' | 'top' | undefined;

export const Tooltip: React.FC<
  PropsWithChildren<{
    title: React.ReactNode | string;
    outlined?: boolean;
    side?: sideTooltip;
    align?: alignTooltip;
    disabled?: boolean;
    triggerStyle?: Record<string, any>;
    boxStyle?: Record<string, any>;
    delayDuration?: number;
  }>
> = ({
  children,
  title,
  triggerStyle,
  boxStyle,
  outlined = true,
  side = 'bottom',
  align = 'center',
  disabled = false,
  delayDuration = 200,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <BaseTooltip.Provider>
      <TooltipRoot delayDuration={delayDuration} open={open && !disabled} onOpenChange={setOpen}>
        <TooltipTrigger style={triggerStyle} asChild>
          {children}
        </TooltipTrigger>
        <TooltipBox sideOffset={10} side={side} align={align} outlined={outlined} style={boxStyle}>
          {title}
        </TooltipBox>
      </TooltipRoot>
    </BaseTooltip.Provider>
  );
};
