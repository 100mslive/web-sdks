import type { HTMLStyledProps } from '../styled-system';
import { styled } from '../styled-system';

const StyledBox = styled('div', {});

export type BoxProps = HTMLStyledProps<typeof StyledBox>;
export const Box = StyledBox;
