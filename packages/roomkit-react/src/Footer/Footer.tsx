import { Flex } from '../Layout';
import { styled } from '../Theme';

const Root = styled(Flex, {
  justifyContent: 'space-between',
  alignItems: 'center',
  py: '4',
  position: 'relative',
  height: '100%',
  '@md': { flexWrap: 'wrap', gap: '4' },
});

const Left = styled(Flex, {
  alignItems: 'center',
  position: 'absolute',
  left: '10',
  gap: '8',
  '@md': {
    position: 'unset',
    justifyContent: 'center',
    w: '100%',
  },
});

const Center = styled(Flex, {
  w: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8',
});

const Right = styled(Flex, {
  alignItems: 'center',
  position: 'absolute',
  right: '10',
  gap: '8',
  '@md': {
    display: 'none',
  },
});

export const Footer = {
  Root,
  Left,
  Center,
  Right,
};
