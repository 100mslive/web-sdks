import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';

export const ActionTile = ({ icon, title, active, onClick, disabled = false, setOpenSettingsSheet: setSheet }) => {
  return (
    <Flex
      direction="column"
      align="center"
      onClick={() => {
        if (!disabled) {
          onClick();
          setSheet(false);
        }
      }}
      css={{
        p: '$4 $2',
        bg: active ? '$surface_bright' : '',
        color: disabled ? '$on_surface_low' : '$on_surface_high',
        gap: '$4',
        r: '$1',
      }}
    >
      {icon}
      <Text variant="xs" css={{ fontWeight: '$semiBold', color: 'inherit', textAlign: 'center' }}>
        {title}
      </Text>
    </Flex>
  );
};
