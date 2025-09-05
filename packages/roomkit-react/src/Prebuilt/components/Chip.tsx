import React from 'react';
import { Flex } from '../../Layout';
import { Text } from '../../Text';

const Chip = ({
  icon = <></>,
  content = '',
  backgroundColor = 'surface.default',
  textColor = 'onSurface.high',
  hideIfNoContent = false,
  onClick,
  css = {},
}: {
  icon?: React.JSX.Element;
  content: string;
  backgroundColor?: string;
  textColor?: string;
  hideIfNoContent?: boolean;
  onClick?: () => void | Promise<void>;
  css?: Record<string, any>;
}) => {
  if (hideIfNoContent && !content) {
    return null;
  }
  return (
    <Flex
      align="center"
      css={{ backgroundColor, p: '$4 $6', gap: '2', borderRadius: '4', ...css }}
      onClick={() => onClick?.()}
    >
      {icon}
      <Text variant="sm" css={{ fontWeight: 'semiBold', color: textColor }}>
        {content}
      </Text>
    </Flex>
  );
};

export default Chip;
