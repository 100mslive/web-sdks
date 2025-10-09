// Open issue with eslint-plugin-import https://github.com/import-js/eslint-plugin-import/issues/1810
// eslint-disable-next-line
import { HMSVirtualBackgroundTypes } from '@100mslive/hms-virtual-background/hmsvbplugin';
import { Box } from '../../../Layout';
import { Text } from '../../../Text';
import { VBOption } from './VBOption';
import { ReactNode } from 'react';

export const VBCollection = ({
  options,
  title,
  activeBackground = '',
}: {
  options: {
    title?: string;
    icon?: ReactNode;
    onClick?: () => Promise<void>;
    mediaURL?: string;
    value: string | HMSVirtualBackgroundTypes;
    supported?: boolean;
  }[];
  title: string;
  activeBackground: string;
}) => {
  if (options.length === 0) {
    return null;
  }
  return (
    <Box css={{ mt: '$10' }}>
      <Text variant="sm" css={{ color: '$on_surface_high', fontWeight: '$semiBold' }}>
        {title}
      </Text>
      <Box css={{ py: '$4', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '$8' }}>
        {options.map((option, index) =>
          option.supported ? (
            <VBOption.Root
              key={option.value}
              testid={option.value === HMSVirtualBackgroundTypes.IMAGE ? `virtual_bg_option-${index}` : option.value}
              {...option}
              isActive={activeBackground === option.value}
            >
              <VBOption.Icon>{option?.icon}</VBOption.Icon>
              <VBOption.Title>{option?.title}</VBOption.Title>
            </VBOption.Root>
          ) : (
            ''
          ),
        )}
      </Box>
    </Box>
  );
};
