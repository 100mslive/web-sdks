import React from "react";
import { Box, Flex, Text } from "@100mslive/react-ui";

export const TextWithIcon = ({ Icon, children, ...textProps }) => (
  <Flex>
    <Box css={{ flexShrink: 0 }}>
      <Icon />
    </Box>
    <Text css={{ ml: "$4" }} {...textProps}>
      {children}
    </Text>
  </Flex>
);
