import { IconButton } from '../../../IconButton';
import { styled } from '../../../Theme';

export const LeaveIconButton = styled(IconButton, {
  color: '$on_primary_high',
  h: '$14',
  px: '$4',
  r: '$1',
  bg: '$alert_error_default',
  '&:not([disabled]):hover': {
    bg: '$alert_error_bright',
  },
  '&:not([disabled]):active': {
    bg: '$alert_error_default',
  },
  containerMd: {
    mx: 0,
  },
});

export const MenuTriggerButton = styled(LeaveIconButton, {
  borderLeft: '1px solid $alert_error_dim',
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  px: '$2',
});
