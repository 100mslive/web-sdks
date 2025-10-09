import { Box, Flex } from '../../../Layout';

export const StickIndicator = ({ total, index }: { total: number; index: number }) => {
  const sticksCount = Math.min(3, total);

  if (total < 2) {
    return null;
  }

  return (
    <Flex direction="column" css={{ gap: '$1' }}>
      {[...Array(sticksCount)].map((_, i) => (
        <Box
          css={{
            borderLeft: '2px solid',
            height: '$4',
            borderColor: i === index ? '$on_surface_high' : '$on_surface_low',
          }}
        />
      ))}
    </Flex>
  );
};
