import { Root, Trigger, Content, Item, Separator, Label, Group } from '@radix-ui/react-dropdown-menu';
import { styled } from '../Theme';

export const Dropdown = styled(Root, {});

export const DropdownTrigger = styled(Trigger, {
  padding: '$2 $4',
  cursor: 'pointer',
  '&[data-state="open"]': {
    backgroundColor: '$menuBg',
    borderRadius: '$1',
  },
});

export const DropdownItem = styled(Item, {
  h: '$14',
  w: '100%',
  color: '$textPrimary',
  p: '$4 $8',
  backgroundColor: '$menuBg',
  display: 'flex',
  alignItems: 'center',
});

export const DropdownItemSeparator = styled(Separator, {
  h: 1,
  backgroundColor: '$grayDefault',
  m: '$4 $8',
});

export const DropdownContent = styled(Content, {
  w: '$56',
  maxHeight: '$56',
  r: '$2',
  p: '$4 0',
  backgroundColor: '$menuBg',
  overflowY: 'auto',
});

export const DropdownLabel = styled(Label, {
  display: 'flex',
  alignItems: 'center',
});
export const DropdownGroup = styled(Group, {});

Dropdown.displayName = 'Dropdown';
DropdownItem.displayName = 'DropdownItem';
DropdownItemSeparator.displayName = 'DropdownItemSeparator';
DropdownContent.displayName = 'DropdownContent';
DropdownLabel.displayName = 'DropdownLabel';
DropdownGroup.displayName = 'DropdownGroup';
