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
    backgroundColor: '$surface_bright',
    c: '$on_surface_high',
  },
  '&:focus': {
    outline: 'none',
  },
  '&:focus-visible': {
    boxShadow: '0 0 0 3px $colors$primary_default',
  },
});

const DropdownTriggerItem = styled(SubTrigger, {
  w: '100%',
  color: '$on_surface_high',
  p: '$8',
  display: 'flex',
  alignItems: 'center',
  '&:hover': {
    cursor: 'pointer',
    bg: '$surface_brighter',
  },
  '&:focus-visible': {
    bg: '$surface_brighter',
    outline: 'none',
  },
});

const DropdownItem = styled(Item, {
  color: '$on_surface_high',
  p: '$8',
  display: 'flex',
  alignItems: 'center',
  outline: 'none',
  backgroundColor: '$surface_dim',
  '&:hover': {
    cursor: 'pointer',
    bg: '$surface_bright',
  },
  '&:focus-visible': {
    bg: '$surface_bright',
  },
});

const DropdownItemSeparator = styled(Separator, {
  h: 1,
  backgroundColor: '$border_bright',
  m: '$4 $8',
});

const DropdownContent = styled(Content, {
  w: '$80',
  maxHeight: '$64',
  r: '$1',
  py: '$4',
  backgroundColor: '$surface_dim',
  overflowY: 'auto',
  boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
  zIndex: 20,
  fontFamily: '$sans',
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
  backgroundColor: '$surface_bright',
  overflowY: 'auto',
  boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
  zIndex: 20,
});

const DropdownCheckboxItem = styled(CheckboxItem, {
  color: '$on_surface_high',
  p: '$8',
  display: 'flex',
  alignItems: 'center',
  outline: 'none',
  '&:hover': {
    cursor: 'pointer',
    bg: '$surface_brighter',
  },
  '&:focus-visible': {
    bg: '$surface_brighter',
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
