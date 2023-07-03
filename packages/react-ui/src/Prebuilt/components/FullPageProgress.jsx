import React from 'react';
import { Flex, Loading } from '../../';

const FullPageProgress = () => (
  <Flex justify="center" align="center" css={{ size: '100%' }}>
    <Loading size={100} />
  </Flex>
);

export default FullPageProgress;
