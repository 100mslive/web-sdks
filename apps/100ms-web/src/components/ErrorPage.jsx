import React from "react";
import errorBgDark from "../images/error-bg-dark.svg";
import errorBgLight from "../images/error-bg-light.svg";
import { Flex, Box, Text, useTheme } from "@100mslive/react-ui";

function ErrorPage({ error, title = "404" }) {
  const themeType = useTheme().themeType;
  return (
    <Flex
      align="center"
      justify="center"
      css={{
        size: "100%",
        color: "$textPrimary",
        backgroundColor: "$bgPrimary",
      }}
    >
      <Box css={{ position: "relative", overflow: "hidden", r: "$3" }}>
        <img
          src={themeType === "dark" ? errorBgDark : errorBgLight}
          alt="error background"
        />
        <Flex
          align="center"
          direction="column"
          css={{ position: "absolute", size: "100%", top: "33.33%", left: 0 }}
        >
          <Text variant="h2">{title}</Text>
          <Text variant="h4" css={{ mt: "1.75rem" }}>
            {error}
          </Text>
        </Flex>
      </Box>
    </Flex>
  );
}

export default ErrorPage;
