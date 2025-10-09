import { FC, PropsWithChildren, ReactNode, useState } from 'react';
import * as BaseTooltip from '@radix-ui/react-tooltip';
import { CSS, styled } from '../Theme';
import { slideDownAndFade, slideLeftAndFade, slideRightAndFade, slideUpAndFade } from '../utils';

const TooltipBox = styled(BaseTooltip.Content, {
  fontFamily: '$sans',
  borderRadius: '$2',
  padding: '$2 $4',
  fontSize: '$xs',
  zIndex: 11,
  color: '$on_surface_high',
  backgroundColor: '$surface_bright',
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
        backgroundColor: '$background_dim',
        border: 'solid $space$px $border_bright',
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

export const Tooltip: FC<
  PropsWithChildren<{
    title: ReactNode | string;
    outlined?: boolean;
    side?: sideTooltip;
    align?: alignTooltip;
    disabled?: boolean;
    triggerCss?: CSS;
    boxCss?: CSS;
    delayDuration?: number;
  }>
> = ({
  children,
  title,
  triggerCss,
  boxCss,
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
        <TooltipTrigger css={{ ...triggerCss }} asChild>
          {children}
        </TooltipTrigger>
        <TooltipBox sideOffset={10} side={side} align={align} outlined={outlined} css={{ ...boxCss }}>
          {title}
        </TooltipBox>
      </TooltipRoot>
    </BaseTooltip.Provider>
  );
};
