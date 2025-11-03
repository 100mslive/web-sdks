import { Tabs as TabsPrimitive } from 'radix-ui';
import { styled } from '../Theme';

const StyledTabsRoot = styled(TabsPrimitive.Root, {
  display: 'flex',
});

const StyledList = styled(TabsPrimitive.List, {
  flexShrink: 0,
  display: 'flex',
});

const StyledTrigger = styled(TabsPrimitive.Trigger, {
  all: 'unset',
  fontFamily: '$sans',
  p: '$8',
  display: 'flex',
  alignItems: 'center',
  fontSize: '$sm',
  lineHeight: '$sm',
  color: '$on_surface_high',
  userSelect: 'none',
  cursor: 'pointer',
  '&[data-state="active"]': {
    bg: '$surface_brighter',
    r: '$1',
  },
});

const StyledContent = styled(TabsPrimitive.Content, {
  flex: '1 1 0',
  padding: '$10',
  outline: 'none',
});

export const Tabs = {
  Root: StyledTabsRoot,
  List: StyledList,
  Content: StyledContent,
  Trigger: StyledTrigger,
};
