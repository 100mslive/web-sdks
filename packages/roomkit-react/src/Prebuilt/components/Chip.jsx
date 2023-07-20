import { Flex } from '../../Layout';
import { Text } from '../../Text';

const Chip = ({ icon = <></>, content = '', backgroundColor = '$surfaceDefault', hideIfNoContent = false }) => {
  if (hideIfNoContent && !content) {
    return;
  }
  return (
    <Flex align="center" css={{ backgroundColor, p: '$4 $6', borderRadius: '$4' }}>
      {icon}
      <Text variant="sm" css={{ fontWeight: '$semiBold', color: '$textHighEmp', ml: '$2' }}>
        {content}
      </Text>
    </Flex>
  );
};

export default Chip;
