import React from "react";
import {
  Box,
  Button,
  Flex,
  HorizontalDivider,
  Text,
} from "@100mslive/react-ui";
import PlaceholderBg from "../images/post_leave.png";

export const PostLeave = ({ history, match }) => {
  return (
    <Flex justify="center" align="center" css={{ size: "100%", bg: "$mainBg" }}>
      <Box
        css={{
          position: "relative",
          overflow: "hidden",
          w: "37.5rem",
          maxWidth: "80%",
          h: "75%",
          r: "$3",
          m: "0 auto",
          backgroundImage: `url(${PlaceholderBg})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Flex
          align="center"
          direction="column"
          css={{
            position: "absolute",
            w: "100%",
            top: "20%",
            left: 0,
            textAlign: "center",
          }}
        >
          <Text
            variant="h4"
            css={{ "@md": { fontSize: "$md" }, fontWeight: "$semiBold" }}
          >
            You left the room
          </Text>
          <Text
            variant="h4"
            css={{
              "@md": { fontSize: "$md" },
              mt: "$8",
              fontWeight: "$semiBold",
            }}
          >
            Have a nice day!
          </Text>
          <HorizontalDivider
            css={{ bg: "$textPrimary", maxWidth: "70%", m: "$10 0" }}
          />
          <Flex justify="center">
            <Button
              onClick={() => {
                let previewUrl = "/preview/" + match.params.roomId;
                if (match.params.role) previewUrl += "/" + match.params.role;
                history.push(previewUrl);
              }}
              css={{ mx: "$4" }}
            >
              Join Again
            </Button>
            <Button
              variant="standard"
              onClick={() => {
                window.open("https://dashboard.100ms.live/", "_blank");
              }}
              css={{ mx: "$4" }}
            >
              Go to dashboard
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Flex>
  );
};
