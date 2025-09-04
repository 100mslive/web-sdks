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
import { styled } from '../styled-system';

const DropdownRoot = styled(Root, {});

const DropdownTrigger = styled(Trigger, {
  base: {
    cursor: 'pointer',
    appearance: 'none !important',
    '&[data-state="open"]': {
      backgroundColor: 'surface.bright',
      color: 'onSurface.high',
    },
    '&:focus': {
      outline: 'none',
    },
    '&:focus-visible': {
      boxShadow: '0 0 0 3px token(colors.primary.default)',
    },
  },
});

const DropdownTriggerItem = styled(SubTrigger, {
  base: {
    width: '100%',
    color: 'onSurface.high',
    padding: 'token(spacing.8)',
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      cursor: 'pointer',
      backgroundColor: 'surface.brighter',
    },
    '&:focus-visible': {
      backgroundColor: 'surface.brighter',
      outline: 'none',
    },
  },
});

const DropdownItem = styled(Item, {
  base: {
    color: 'onSurface.high',
    padding: 'token(spacing.8)',
    display: 'flex',
    alignItems: 'center',
    outline: 'none',
    backgroundColor: 'surface.dim',
    '&:hover': {
      cursor: 'pointer',
      backgroundColor: 'surface.bright',
    },
    '&:focus-visible': {
      backgroundColor: 'surface.bright',
    },
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
