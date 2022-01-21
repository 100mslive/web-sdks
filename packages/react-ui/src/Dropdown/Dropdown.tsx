import { Root, Trigger, Content, Item, Separator } from '@radix-ui/react-dropdown-menu';
import { styled } from '../stitches.config';

export const Dropdown = styled(Root, {});

export const DropdownTrigger = styled(Trigger, {});

export const DropdownItem = styled(Item, {
  h: '$4',
  w: '100%',
  color: '$fg',
  p: '$2 $3',
});

export const DropdownItemSeparator = styled(Separator, {
  h: 1,
  backgroundColor: '$grey2',
  m: '$1 $3',
});

export const DropdownContent = styled(Content, {
  w: '$menu',
  maxHeight: '$menu',
  r: '$2',
  p: '$2 0',
  backgroundColor: '$grey1',
});

Dropdown.displayName = 'Dropdown';
DropdownItem.displayName = 'DropdownItem';
DropdownItemSeparator.displayName = 'DropdownItemSeparator';
DropdownContent.displayName = 'DropdownContent';
