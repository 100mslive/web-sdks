import React from 'react';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';

export const LeaveCard = ({
  icon,
  title,
  subtitle,
  onClick,
  bg,
  titleColor,
  css = {},
}: {
  icon: React.JSX.Element;
  title: string;
  subtitle: string;
  onClick: () => void;
  titleColor: string;
  bg: string;
  css?: Record<string, any>;
}) => {
  return (
    <Flex css={{ p: '10', flexGrow: 1, gap: '8', bg, ...css }} onClick={onClick}>
      <Box css={{ color: titleColor }}>{icon}</Box>
      <Box css={{ gap: '2' }}>
        <Text variant="lg" css={{ color: titleColor }}>
          {title}
        </Text>
        <Text variant="sm" css={{ c: 'inherit' }}>
          {subtitle}
        </Text>
      </Box>
    </Flex>
  );
};
