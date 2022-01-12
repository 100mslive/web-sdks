import * as Popover from '@radix-ui/react-popover';
import { styled } from '../stitches.config';
import { popoverAnimation } from '../utils/animations';
import { flexCenter } from '../utils/styles';

export const StyledRoot = styled('div', {
  position: 'absolute',
  top: '20px',
  right: '20px',
  // display: 'none',
});

export const StyledTrigger = styled(Popover.Trigger, {
  width: '36px',
  height: '36px',
  color: 'white',
  borderRadius: '$round',
  backgroundColor: '$menuBg',
  ...flexCenter,
});

export const StyledContent = styled(Popover.Content, {
  backgroundColor: '$grey2',
  padding: '10px 0px',
  display: 'flex',
  flexDirection: 'column',
  width: '200px',
  borderRadius: '12px',
  ...popoverAnimation,
});

export const styledItem = {
  fontSize: '14px',
  color: '$fg',
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  width: '100%',
};

export const StyledItemButton = styled('button', {
  ...styledItem,
  height: '40px',
  '&:hover': {
    backgroundColor: '$grey3',
  },
  '&:focus': {
    outline: 'none',
    // backgroundColor: '$grey3',
  },
  '& > * + *': {
    marginRight: '0',
    marginLeft: '0.5rem',
  },
});

export const StyledVolumeItem = styled('div', {
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

export const RemoveMenuItem = styled(StyledItemButton, {
  color: '$redMain',
  borderTop: '1px solid $grey4',
});
