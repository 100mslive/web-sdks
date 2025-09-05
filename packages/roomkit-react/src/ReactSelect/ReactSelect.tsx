import * as SelectPrimitive from '@radix-ui/react-select';
import { styled } from '../Theme';

const StyledRoot = styled(SelectPrimitive.Root, {});

const StyledTrigger = styled(SelectPrimitive.Trigger, {
  all: 'unset',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '2',
  padding: '8',
  lineHeight: '$px',
  gap: '8',
  backgroundColor: 'secondary.default',
  color: 'onPrimary.high',
  fontSize: '$8',
  cursor: 'pointer',
  r: '1',
});

const StyledContent = styled(SelectPrimitive.Content, {
  overflow: 'hidden',
  backgroundColor: 'surface.bright',
  r: '1',
  h: '80',
});

const StyledViewport = styled(SelectPrimitive.Viewport, {
  padding: '3',
});

const StyledItem = styled(SelectPrimitive.Item, {
  all: 'unset',
  fontSize: '$7',
  r: '1',
  display: 'flex',
  p: '$4 $8',
  w: '52',
  position: 'relative',
  userSelect: 'none',
  cursor: 'pointer',
});

const StyledLabel = styled(SelectPrimitive.Label, {
  p: '$4 $8',
  lineHeight: '$10',
  color: 'onPrimary.high',
});

const StyledSeparator = styled(SelectPrimitive.Separator, {
  height: 'px',
  backgroundColor: 'onPrimary.high',
  margin: '4',
  opacity: 0.4,
});

const StyledItemIndicator = styled(SelectPrimitive.ItemIndicator, {
  position: 'absolute',
  right: '8',
  width: '8',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'onPrimary.high',
});

const scrollButtonStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  p: '4',
  backgroundColor: 'surface.bright',
  color: 'onPrimary.high',
  cursor: 'default',
};

const StyledScrollUpButton = styled(SelectPrimitive.ScrollUpButton, scrollButtonStyles);

const StyledScrollDownButton = styled(SelectPrimitive.ScrollDownButton, scrollButtonStyles);

export const Select = {
  Root: StyledRoot,
  Trigger: StyledTrigger,
  Content: StyledContent,
  Viewport: StyledViewport,
  Item: StyledItem,
  Label: StyledLabel,
  Separator: StyledSeparator,
  ItemIndicator: StyledItemIndicator,
  ScrollUpButton: StyledScrollUpButton,
  ScrollDownButton: StyledScrollDownButton,
  Value: SelectPrimitive.Value,
  Icon: SelectPrimitive.Icon,
  ItemText: SelectPrimitive.ItemText,
  Group: SelectPrimitive.Group,
};
