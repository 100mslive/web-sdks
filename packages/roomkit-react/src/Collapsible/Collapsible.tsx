import { Content, Root, Trigger } from '@radix-ui/react-collapsible';
import type { HTMLStyledProps } from '../styled-system';
import { styled } from '../styled-system';
import { slideDown, slideUp } from '../utils';

const CollapsibleRoot = styled(Root, {});

const CollapsibleTrigger = styled(Trigger, {
  base: {
    cursor: 'pointer',
    appearance: 'none !important',
    '&:focus': {
      outline: 'none',
    },
    '&:focus-visible': {
      boxShadow: '0 0 0 3px {colors.primary.default}',
    },
  },
});

const CollapsibleContent = styled(Content, {
  base: {
    width: '80',
    borderRadius: '1',
    overflowY: 'auto',
    '&[data-state="open"]': {
      '--controller-height': 'var(--radix-collapsible-content-height)',
      animation: `${slideDown} 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards`,
    },
    '&[data-state="closed"]': {
      '--controller-height': 'var(--radix-collapsible-content-height)',
      animation: `${slideUp} 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards`,
    },
  },
});

export const Collapsible = {
  Root: CollapsibleRoot,
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
};

export type CollapsibleRootProps = HTMLStyledProps<typeof CollapsibleRoot>;
export type CollapsibleTriggerProps = HTMLStyledProps<typeof CollapsibleTrigger>;
export type CollapsibleContentProps = HTMLStyledProps<typeof CollapsibleContent>;
