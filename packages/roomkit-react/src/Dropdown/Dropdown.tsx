import {
  CheckboxItem,
  Content,
  Group,
  Item,
  ItemIndicator,
  Label,
  Portal,
  Root,
  Separator,
  Sub,
  SubContent,
  SubTrigger,
  Trigger,
} from '@radix-ui/react-dropdown-menu';
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
  '&:focus-visible': {
    boxShadow: '0 0 0 3px $colors$primaryDefault',
  },
});

const DropdownTriggerItem = styled(SubTrigger, {
  w: '100%',
  color: '$textPrimary',
  p: '$8',
  display: 'flex',
  alignItems: 'center',
  '&:hover': {
    cursor: 'pointer',
    bg: '$surfaceLighter',
  },
  '&:focus-visible': {
    bg: '$surfaceLighter',
  },
});

const DropdownItem = styled(Item, {
  color: '$textPrimary',
  p: '$8',
  display: 'flex',
  alignItems: 'center',
  outline: 'none',
  '&:hover': {
    cursor: 'pointer',
    bg: '$surfaceLighter',
  },
  '&:focus-visible': {
    bg: '$surfaceLighter',
  },
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
  py: '$4',
  backgroundColor: '$surfaceLight',
  overflowY: 'auto',
  boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
  zIndex: 20,
});

const DropdownLabel = styled(Label, {
  display: 'flex',
  alignItems: 'center',
  h: '$12',
  w: '100%',
  p: '$8 $4',
});

const DropdownGroup = styled(Group, {});

const DropdownSubMenu = styled(Sub, {});

const DropdownSubMenuContent = styled(SubContent, {
  w: '$80',
  maxHeight: '$64',
  r: '$1',
  py: '$4',
  backgroundColor: '$surfaceLight',
  overflowY: 'auto',
  boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
  zIndex: 20,
});

const DropdownCheckboxItem = styled(CheckboxItem, {
  color: '$textPrimary',
  p: '$8',
  display: 'flex',
  alignItems: 'center',
  outline: 'none',
  '&:hover': {
    cursor: 'pointer',
    bg: '$surfaceLighter',
  },
  '&:focus-visible': {
    bg: '$surfaceLighter',
  },
  gap: '$2',
});

const DropdownItemIndicator = styled(ItemIndicator, {
  w: '$10',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const Dropdown = {
  Root: DropdownRoot,
  Trigger: DropdownTrigger,
  TriggerItem: DropdownTriggerItem,
  Content: DropdownContent,
  Portal: Portal,
  SubMenu: DropdownSubMenu,
  SubMenuContent: DropdownSubMenuContent,
  Item: DropdownItem,
  Label: DropdownLabel,
  Group: DropdownGroup,
  ItemSeparator: DropdownItemSeparator,
  CheckboxItem: DropdownCheckboxItem,
  ItemIndicator: DropdownItemIndicator,
};
