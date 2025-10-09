import { FC, forwardRef, PropsWithChildren } from 'react';
import * as BaseAccordion from '@radix-ui/react-accordion';
import { CSS } from '@stitches/react';
import { ChevronUpIcon } from '@100mslive/react-icons';
import { Box } from '../Layout';
import { styled } from '../Theme';
import { slideDown, slideUp } from '../utils';

const StyledAccordion = styled(BaseAccordion.Root, {});

const StyledItem = styled(BaseAccordion.Item, {
  marginTop: '$px',
  display: 'block',
  '&:first-child': {
    marginTop: 0,
    borderTopLeftRadius: '$0',
    borderTopRightRadius: '$0',
  },
  '&:last-child': {
    borderBottomLeftRadius: '$4',
    borderBottomRightRadius: '$4',
  },
});

const StyledHeader = styled(BaseAccordion.Header, {
  all: 'unset',
  display: 'flex',
  fontFamily: '$sans',
});

const StyledTrigger = styled(BaseAccordion.Trigger, {
  all: 'unset',
  fontFamily: '$sans',
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '$md',
  lineHeight: '$md',
  color: '$on_surface_high',
});

const StyledContent = styled(BaseAccordion.Content, {
  display: 'contents',
  fontSize: '$md',
  fontFamily: '$sans',
  color: '$on_surface_medium',
  '&[data-state="open"]': {
    animation: `${slideDown('--radix-accordion-content-height')} 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards`,
  },
  '&[data-state="closed"]': {
    animation: `${slideUp('--radix-accordion-content-height')} 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards`,
  },
});

const StyledChevron = styled(ChevronUpIcon, {
  color: '$on_primary_high',
  transition: 'transform 300ms cubic-bezier(0.87, 0, 0.13, 1)',
  '[data-state=closed] &': { transform: 'rotate(180deg)' },
});

// Exports
export const AccordionRoot = StyledAccordion;
export const AccordionItem = StyledItem;

export const AccordionHeader: FC<
  PropsWithChildren<BaseAccordion.AccordionTriggerProps & { iconStyles?: CSS; css?: CSS; chevronID?: string }>
> = forwardRef<
  HTMLButtonElement,
  PropsWithChildren<BaseAccordion.AccordionTriggerProps & { iconStyles?: CSS; css?: CSS; chevronID?: string }>
>(({ children, iconStyles, css, chevronID, ...props }, forwardedRef) => (
  <StyledHeader css={css}>
    <StyledTrigger {...props} ref={forwardedRef}>
      {children}
      <StyledChevron data-testid={chevronID} aria-hidden css={iconStyles} />
    </StyledTrigger>
  </StyledHeader>
));

export const AccordionContent: FC<PropsWithChildren<BaseAccordion.AccordionContentProps & { contentStyles?: CSS }>> =
  forwardRef<HTMLDivElement, PropsWithChildren<BaseAccordion.AccordionContentProps & { contentStyles?: CSS }>>(
    ({ children, contentStyles, ...props }, forwardedRef) => (
      <StyledContent {...props} ref={forwardedRef}>
        <Box css={contentStyles}>{children}</Box>
      </StyledContent>
    ),
  );
