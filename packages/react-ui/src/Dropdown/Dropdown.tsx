import { Root, Trigger, Content, Item, Separator } from '@radix-ui/react-dropdown-menu';
import { styled } from '../Theme';

export const Dropdown = styled(Root, {});

export const DropdownTrigger = styled(Trigger, {
  padding: '$2 $4',
  cursor: 'pointer',
  '&[data-state="open"]': {
    backgroundColor: '$grayDark',
    borderRadius: '$1',
    '& > svg': {
      transform: 'rotate(180deg)',
    },
  },
});

export const DropdownItem = styled(Item, {
  h: '$14',
  w: '100%',
  color: '$textPrimary',
  p: '$4 $8',
  backgroundColor: '$grayDark',
  display: 'flex',
  alignItems: 'center',
  '&:hover': { backgroundColor: `rgba('$grayDark', 0.5)` },
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
  backgroundColor: '$grayDark',
  overflowY: 'auto',
});

Dropdown.displayName = 'Dropdown';
DropdownItem.displayName = 'DropdownItem';
DropdownItemSeparator.displayName = 'DropdownItemSeparator';
DropdownContent.displayName = 'DropdownContent';
