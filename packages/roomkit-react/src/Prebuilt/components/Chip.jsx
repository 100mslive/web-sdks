import { Flex } from '../../Layout';
import { Text } from '../../Text';

const Chip = ({ icon = <></>, content = '', backgroundColor = '$surface_default', hideIfNoContent = false }) => {
  if (hideIfNoContent && !content) {
    return;
  }
  return (
    <Flex align="center" css={{ backgroundColor, p: '$4', borderRadius: '$4' }}>
      {icon}
      <Text variant="sm" css={{ fontWeight: '$semiBold', color: '$on_surface_high', ml: '$2' }}>
        {content}
      </Text>
    </Flex>
  );
};

export default Chip;
