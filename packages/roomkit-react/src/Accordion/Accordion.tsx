import React, { PropsWithChildren } from 'react';
import * as BaseAccordion from '@radix-ui/react-accordion';
import { ChevronUpIcon } from '@100mslive/react-icons';
import { Box } from '../Layout';
import { styled } from '../styled-system';
import { slideDown, slideUp } from '../utils';

const StyledAccordion = styled(BaseAccordion.Root, {
  base: {},
});

const StyledItem = styled(BaseAccordion.Item, {
  base: {
    marginTop: 'px',
    display: 'block',
    '&:first-child': {
      marginTop: 0,
      borderTopLeftRadius: '0',
      borderTopRightRadius: '0',
    },
    '&:last-child': {
      borderBottomLeftRadius: '4',
      borderBottomRightRadius: '4',
    },
  },
});

const StyledHeader = styled(BaseAccordion.Header, {
  base: {
    all: 'unset',
    display: 'flex',
    fontFamily: 'sans',
  },
});

const StyledTrigger = styled(BaseAccordion.Trigger, {
  base: {
    all: 'unset',
    fontFamily: 'sans',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 'md',
    lineHeight: 'md',
    color: 'onSurface.high',
  },
});

const StyledContent = styled(BaseAccordion.Content, {
  base: {
    display: 'contents',
    fontSize: 'md',
    fontFamily: 'sans',
    color: 'onSurface.medium',
    '&[data-state="open"]': {
      animation: `${slideDown('--radix-accordion-content-height')} 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards`,
    },
    '&[data-state="closed"]': {
      animation: `${slideUp('--radix-accordion-content-height')} 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards`,
    },
  },
});

const StyledChevron = styled(ChevronUpIcon, {
  base: {
    color: 'onPrimary.high',
    transition: 'transform 300ms cubic-bezier(0.87, 0, 0.13, 1)',
    '[data-state=closed] &': { transform: 'rotate(180deg)' },
  },
});

// Exports
export const AccordionRoot = StyledAccordion;
export const AccordionItem = StyledItem;

type StyleProp = Record<string, any>;

export const AccordionHeader: React.FC<
  PropsWithChildren<
    BaseAccordion.AccordionTriggerProps & { iconStyles?: StyleProp; css?: StyleProp; chevronID?: string }
  >
> = React.forwardRef<
  HTMLButtonElement,
  PropsWithChildren<
    BaseAccordion.AccordionTriggerProps & { iconStyles?: StyleProp; css?: StyleProp; chevronID?: string }
  >
>(({ children, iconStyles, css, chevronID, ...props }, forwardedRef) => (
  <StyledHeader style={css}>
    <StyledTrigger {...props} ref={forwardedRef}>
      {children}
      <StyledChevron data-testid={chevronID} aria-hidden style={iconStyles} />
    </StyledTrigger>
  </StyledHeader>
));

export const AccordionContent: React.FC<
  PropsWithChildren<BaseAccordion.AccordionContentProps & { contentStyles?: StyleProp }>
> = React.forwardRef<
  HTMLDivElement,
  PropsWithChildren<BaseAccordion.AccordionContentProps & { contentStyles?: StyleProp }>
>(({ children, contentStyles, ...props }, forwardedRef) => (
  <StyledContent {...props} ref={forwardedRef}>
    <Box style={contentStyles}>{children}</Box>
  </StyledContent>
));
