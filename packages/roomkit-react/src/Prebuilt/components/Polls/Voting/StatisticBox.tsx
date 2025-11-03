import { Box } from '../../../../Layout';
import { Text } from '../../../../Text';

export const StatisticBox = ({ title, value = 0 }: { title: string; value: string | number | undefined }) => {
  if (!value && !(typeof value === 'number')) {
    return <></>;
  }
  return (
    <Box css={{ p: '$8', background: '$surface_default', borderRadius: '$1', w: '100%' }}>
      <Text
        variant="tiny"
        css={{ textTransform: 'uppercase', color: '$on_surface_medium', fontWeight: '$semiBold', my: '$4' }}
      >
        {title}
      </Text>
      <Text css={{ fontWeight: '$semiBold' }}>{value}</Text>
    </Box>
  );
};
