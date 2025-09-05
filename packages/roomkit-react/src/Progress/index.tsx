import { Indicator, Root } from '@radix-ui/react-progress';
import { styled } from '../Theme';

const StyledIndicator = styled(Indicator, { h: '4', backgroundColor: 'primary.default' });

const StyledRoot = styled(Root, {
  w: '100%',
  h: '4',
  borderRadius: 'round',
  backgroundColor: 'secondary.dim',
  overflow: 'hidden',
});

export const Progress = {
  Root: StyledRoot,
  Content: StyledIndicator,
};
