import { ReactNode } from 'react';
import { Flex } from '../../Layout';
import { Text } from '../../Text';
import { CSS } from '../../Theme';

const Chip = ({
  icon = <></>,
  content = '',
  backgroundColor = '$surface_default',
  textColor = '$on_surface_high',
  hideIfNoContent = false,
  onClick,
  css = {},
}: {
  icon?: ReactNode;
  content: string;
  backgroundColor?: string;
  textColor?: string;
  hideIfNoContent?: boolean;
  onClick?: () => void | Promise<void>;
  css?: CSS;
}) => {
  if (hideIfNoContent && !content) {
    return null;
  }
  return (
    <Flex
      align="center"
      css={{ backgroundColor, p: '$4 $6', gap: '$2', borderRadius: '$4', ...css }}
      onClick={() => onClick?.()}
    >
      {icon}
      <Text variant="sm" css={{ fontWeight: '$semiBold', color: textColor }}>
        {content}
      </Text>
    </Flex>
  );
};

export default Chip;
