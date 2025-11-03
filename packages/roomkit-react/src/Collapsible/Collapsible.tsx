import { Collapsible as CollapsiblePrimitive } from 'radix-ui';
import { styled } from '../Theme';
import { slideDown, slideUp } from '../utils';
const { Content, Root, Trigger } = CollapsiblePrimitive;

const CollapsibleRoot = styled(Root, {});

const CollapsibleTrigger = styled(Trigger, {
  cursor: 'pointer',
  appearance: 'none !important',
  '&:focus': {
    outline: 'none',
  },
  '&:focus-visible': {
    boxShadow: '0 0 0 3px $colors$primary_default',
  },
});

const CollapsibleContent = styled(Content, {
  w: '$80',
  r: '$1',
  overflowY: 'auto',
  '&[data-state="open"]': {
    animation: `${slideDown('--radix-collapsible-content-height')} 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards`,
  },
  '&[data-state="closed"]': {
    animation: `${slideUp('--radix-collapsible-content-height')} 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards`,
  },
});

export const Collapsible = {
  Root: CollapsibleRoot,
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
};
