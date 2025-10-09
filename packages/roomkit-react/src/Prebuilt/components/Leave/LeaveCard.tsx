import { ReactNode } from 'react';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { CSS } from '../../../Theme';

export const LeaveCard = ({
  icon,
  title,
  subtitle,
  onClick,
  bg,
  titleColor,
  css = {},
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  titleColor: string;
  bg: string;
  css?: CSS;
}) => {
  return (
    <Flex css={{ p: '$10', flexGrow: 1, gap: '$8', bg, ...css }} onClick={onClick}>
      <Box css={{ color: titleColor }}>{icon}</Box>
      <Box css={{ gap: '$2' }}>
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
