import React from 'react';
import { Flex } from '../../Layout';
import { Loading } from '../../Loading';
import { Text } from '../../Text';

const FullPageProgress = ({
  loaderColor = '$primary_default',
  text = '',
  css = {},
}: {
  loaderColor?: string;
  text?: string;
  css?: Record<string, any>;
}) => (
  <Flex direction="column" justify="center" align="center" css={{ size: '100%', color: loaderColor, ...css }}>
    <Loading color="currentColor" size={100} />
    {text ? <Text css={{ mt: '$10', color: '$on_surface_high' }}>{text}</Text> : null}
  </Flex>
);

export default FullPageProgress;
