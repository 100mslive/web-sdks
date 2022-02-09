import * as Popover from '@radix-ui/react-popover';
import { styled } from '../stitches.config';
import { popoverAnimation } from '../utils/animations';
import { flexCenter } from '../utils/styles';

const Root = Popover.Root;

const StyledTrigger = styled(Popover.Trigger, {
  position: 'absolute',
  top: '10px',
  right: '10px',
  zIndex: 20,
  width: '36px',
  height: '36px',
  color: 'white',
  borderRadius: '$round',
  backgroundColor: '$menuBg',
  ...flexCenter,
  '&:not([disabled]):focus': {
    outline: 'none',
    boxShadow: '0 0 0 3px $colors$brandTint',
  },
});

const StyledContent = styled(Popover.Content, {
  backgroundColor: '$grey2',
  padding: '10px 0px',
  display: 'flex',
  flexDirection: 'column',
  width: '200px',
  borderRadius: '12px',
  ...popoverAnimation,
});

const styledItem = {
  fontSize: '14px',
  color: '$fg',
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  width: '100%',
};

const StyledItemButton = styled('button', {
  ...styledItem,
  height: '40px',
  '&:hover': {
    backgroundColor: '$grey3',
  },
  // TODO: default focus applied cause issues with this style
  '&:focus': {
    outline: 'none',
    // backgroundColor: '$grey3',
  },
  '& > * + *': {
    marginRight: '0',
    marginLeft: '0.5rem',
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
    marginLeft: '0.5rem',
  },
});

const RemoveMenuItem = styled(StyledItemButton, {
  color: '$redMain',
  borderTop: '1px solid $grey4',
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
