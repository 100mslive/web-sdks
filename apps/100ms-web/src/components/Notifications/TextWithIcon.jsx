import React from "react";
import { Box, Text } from "@100mslive/react-ui";

export const TextWithIcon = ({ Icon, children }) => (
  <Text css={{ display: "flex", alignItems: "center" }}>
    <Box as="span" css={{ flexShrink: 0, mr: "$4" }}>
      <Icon />
    </Box>
    {children}
  </Text>
);
