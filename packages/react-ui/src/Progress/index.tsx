import { Indicator, Root } from '@radix-ui/react-progress';
import { styled } from '../Theme';

const StyledIndicator = styled(Indicator, {});

const StyledRoot = styled(Root, {});

export const Progress = {
  Root: StyledRoot,
  Content: StyledIndicator,
};
