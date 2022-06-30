import { Root, Trigger, TriggerItem, Content, Item, Separator, Label, Group } from '@radix-ui/react-dropdown-menu';
import { styled } from '../Theme';

const DropdownRoot = styled(Root, {});

const DropdownTrigger = styled(Trigger, {
  cursor: 'pointer',
  appearance: 'none !important',
  '&[data-state="open"]': {
    backgroundColor: '$surfaceLight',
  },
  '&:focus': {
    outline: 'none',
  },
});

const DropdownTriggerItem = styled(TriggerItem, {
  h: '$14',
  w: '100%',
  color: '$textPrimary',
  p: '$4 $8',
  display: 'flex',
  alignItems: 'center',
});

const DropdownItem = styled(Item, {
  h: '$12',
  color: '$textPrimary',
  p: '$8 $4',
  display: 'flex',
  alignItems: 'center',
  outline: 'none',
  cursor: 'pointer',
});

const DropdownItemSeparator = styled(Separator, {
  h: 1,
  backgroundColor: '$grayDefault',
  m: '$4 $8',
});

const DropdownContent = styled(Content, {
  w: '$80',
  maxHeight: '$64',
  r: '$1',
  p: '$4',
  backgroundColor: '$surfaceLight',
  overflowY: 'auto',
});

const DropdownLabel = styled(Label, {
  display: 'flex',
  alignItems: 'center',
  h: '$12',
  w: '100%',
  p: '$8 $4',
});

const DropdownGroup = styled(Group, {});

export const Dropdown = {
  Root: DropdownRoot,
  Trigger: DropdownTrigger,
  TriggerItem: DropdownTriggerItem,
  Content: DropdownContent,
  Item: DropdownItem,
  Label: DropdownLabel,
  Group: DropdownGroup,
  ItemSeparator: DropdownItemSeparator,
};
