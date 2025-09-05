import * as Popover from '@radix-ui/react-popover';
import { styled } from '../Theme';
import { popoverAnimation } from '../utils/animations';
import { flexCenter } from '../utils/styles';

const Root = Popover.Root;

const StyledTrigger = styled(Popover.Trigger, {
  position: 'absolute',
  bottom: '2',
  right: '2',
  zIndex: 10,
  width: '13',
  height: '13',
  color: 'onSurface.high',
  borderRadius: '2',
  backgroundColor: 'surface.bright',
  cursor: 'pointer',
  border: 'none',
  ...flexCenter,
  '&:not([disabled]):focus': {
    outline: 'none',
    boxShadow: '0 0 0 3px $colorsprimary.bright',
  },
});

const StyledContent = styled(Popover.Content, {
  fontFamily: '$sans',
  backgroundColor: 'surface.dim',
  padding: '$5 0',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '$space$6',
  zIndex: 11,
  width: '60',
  ...popoverAnimation,
});

const styledItem = {
  fontSize: 'sm',
  color: 'onSurface.high',
  display: 'flex',
  alignItems: 'center',
  padding: '$4 $6',
  width: '100%',
  backgroundColor: '$menuBg',
};

const StyledItemButton = styled('button', {
  ...styledItem,
  height: '14',
  border: 'none',
  '&:hover': {
    backgroundColor: 'surface.brighter',
  },
  cursor: 'pointer',
  // TODO: default focus applied cause issues with this style
  '&:focus': {
    outline: 'none',
    // backgroundColor: '$grey3',
  },
  '& > * + *': {
    marginRight: '0',
    marginLeft: '4',
  },
});

const StyledVolumeItem = styled('div', {
  // TODO: maybe keep this as base comp and extend button variant
  ...styledItem,
  alignItems: 'start',
  flexDirection: 'column',
  marginBottom: '0',
});

export const Flex = styled('div', {
  display: 'flex',
  '& > * + *': {
    marginRight: '0',
    marginLeft: '4',
  },
});

const RemoveMenuItem = styled(StyledItemButton, {
  color: 'alert.error.default',
  borderTop: '1px solid border.bright',
});

interface MenuTileType {
  Root: typeof Root;
  Trigger: typeof StyledTrigger;
  Content: typeof StyledContent;
  ItemButton: typeof StyledItemButton;
  VolumeItem: typeof StyledVolumeItem;
  RemoveItem: typeof RemoveMenuItem;
}

export const StyledMenuTile: MenuTileType = {
  Root,
  Trigger: StyledTrigger,
  Content: StyledContent,
  ItemButton: StyledItemButton,
  VolumeItem: StyledVolumeItem,
  RemoveItem: RemoveMenuItem,
};
