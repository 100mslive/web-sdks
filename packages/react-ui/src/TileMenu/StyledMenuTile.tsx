import * as Popover from '@radix-ui/react-popover';
import { styled } from '../Theme';
import { popoverAnimation } from '../utils/animations';
import { flexCenter } from '../utils/styles';

const Root = Popover.Root;

const StyledTrigger = styled(Popover.Trigger, {
  position: 'absolute',
  bottom: '$2',
  right: '$2',
  zIndex: 10,
  width: '$13',
  height: '$13',
  color: '$textPrimary',
  borderRadius: '$round',
  backgroundColor: '$menuBg',
  border: 'none',
  ...flexCenter,
  '&:not([disabled]):focus': {
    outline: 'none',
    boxShadow: '0 0 0 3px $colors$brandLight',
  },
});

const StyledContent = styled(Popover.Content, {
  fontFamily: '$sans',
  backgroundColor: '$menuBg',
  padding: '$5 0',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '$space$6',
  zIndex: 11,
  width: '$60',
  ...popoverAnimation,
});

const styledItem = {
  fontSize: '$sm',
  color: '$textPrimary',
  display: 'flex',
  alignItems: 'center',
  padding: '$4 $6',
  width: '100%',
};

const StyledItemButton = styled('button', {
  ...styledItem,
  height: '$14',
  '&:hover': {
    backgroundColor: '$menuBg',
  },
  // TODO: default focus applied cause issues with this style
  '&:focus': {
    outline: 'none',
    // backgroundColor: '$grey3',
  },
  '& > * + *': {
    marginRight: '0',
    marginLeft: '$4',
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
    marginLeft: '$4',
  },
});

const RemoveMenuItem = styled(StyledItemButton, {
  color: '$error',
  borderTop: '1px solid $borderLight',
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
