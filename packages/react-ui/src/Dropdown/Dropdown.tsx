import { Root, Trigger, Content, Item, Separator, Label, Group } from '@radix-ui/react-dropdown-menu';
import { styled } from '../Theme';

const DropdownRoot = styled(Root, {});

const DropdownTrigger = styled(Trigger, {
  padding: '$2 $4',
  cursor: 'pointer',
  '&[data-state="open"]': {
    backgroundColor: '$menuBg',
    borderRadius: '$1',
  },
});

const DropdownItem = styled(Item, {
  h: '$14',
  w: '100%',
  color: '$textPrimary',
  p: '$4 $8',
  backgroundColor: '$menuBg',
  display: 'flex',
  alignItems: 'center',
  '&:hover': {
    cursor: 'pointer',
  },
});

const DropdownItemSeparator = styled(Separator, {
  h: 1,
  backgroundColor: '$grayDefault',
  m: '$4 $8',
});

const DropdownContent = styled(Content, {
  w: '$56',
  maxHeight: '$56',
  r: '$2',
  p: '$4 0',
  backgroundColor: '$menuBg',
  overflowY: 'auto',
});

const DropdownLabel = styled(Label, {
  display: 'flex',
  alignItems: 'center',
});

const DropdownGroup = styled(Group, {});

export const Dropdown = {
  Root: DropdownRoot,
  Trigger: DropdownTrigger,
  Content: DropdownContent,
  Item: DropdownItem,
  Label: DropdownLabel,
  Group: DropdownGroup,
  ItemSeparator: DropdownItemSeparator,
};
