import React from 'react';
import { Flex } from '../../Layout';
import { Loading } from '../../Loading';
import { Text } from '../../Text';

const FullPageProgress = ({ loaderColor = '$textHighEmp', loadingText = '' }) => (
  <Flex direction="column" justify="center" align="center" css={{ size: '100%', color: loaderColor }}>
    <Loading color="currentColor" size={100} />
    {loadingText ? <Text>{loadingText}</Text> : null}
  </Flex>
);

export default FullPageProgress;
