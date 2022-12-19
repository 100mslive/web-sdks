import React from "react";
import { ColoredHandIcon } from "@100mslive/react-icons";
import { Box, Flex, Text } from "@100mslive/react-ui";

export const WaitingView = React.memo(() => {
  return (
    <Box
      css={{
        overflow: "hidden",
        w: "96%",
        maxWidth: "96%",
        h: "100%",
        m: "auto",
        background: "#13161B",
        borderRadius: "$3",
      }}
      data-testid="waiting_view"
    >
      <Flex
        align="center"
        direction="column"
        css={{
          w: "24rem",
          textAlign: "center",
          margin: "auto",
          h: "100%",
          justifyContent: "center",
          gap: "$8",
        }}
      >
        <ColoredHandIcon width="80px" height="80px" />
        <Flex
          direction="column"
          css={{
            w: "20rem",
            p: "$1",
            gap: "$4",
          }}
        >
          <Text color="white" variant="h6" css={{ "@md": { fontSize: "$md" } }}>
            Please wait
          </Text>
          <Text color="#E0ECFF" css={{ mt: "$4", "@md": { fontSize: "$sm" } }}>
            Sit back and relax till others let you join.
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
});
