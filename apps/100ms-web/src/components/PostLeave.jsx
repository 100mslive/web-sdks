import React from "react";
import { useParams } from "react-router-dom";
import { Button, Flex, Text } from "@100mslive/react-ui";
import { ExitIcon } from "@100mslive/react-icons";
import { ToastManager } from "./Toast/ToastManager";
import { useNavigation } from "./hooks/useNavigation";

const PostLeave = () => {
  const navigate = useNavigation();
  const { roomId, role } = useParams();
  return (
    <Flex
      justify="center"
      direction="column"
      align="center"
      css={{ size: "100%", bg: "$mainBg" }}
    >
      <Text variant="h2" css={{ fontWeight: "$semiBold" }}>
        👋
      </Text>
      <Text
        variant="h4"
        css={{ color: "$textHighEmp", fontWeight: "$semiBold", mt: "$12" }}
      >
        You left the stream
      </Text>
      <Text
        variant="body1"
        css={{ color: "$textMedEmp", mt: "$8", fontWeight: "$regular" }}
      >
        Have a nice day, Iwobi!
      </Text>
      <Flex css={{ mt: "$14", gap: "$10", alignItems: "center" }}>
        <Text
          variant="body1"
          css={{ color: "$textMedEmp", fontWeight: "$regular" }}
        >
          Left by mistake?
        </Text>
        <Button
          onClick={() => {
            let previewUrl = "/preview/" + roomId;
            if (role) previewUrl += "/" + role;
            navigate(previewUrl);
            ToastManager.clearAllToast();
          }}
          data-testid="join_again_btn"
        >
          <ExitIcon />
          <Text css={{ ml: "$3", fontWeight: "$semiBold" }}>Rejoin</Text>
        </Button>
      </Flex>
      <Button
        variant="standard"
        data-testid="send_feedback_btn"
        outlined
        css={{
          position: "fixed",
          bottom: "$10",
          left: "45%",
          fontWeight: "$semiBold",
        }}
      >
        Send Feedback
      </Button>
    </Flex>
  );
};

export default PostLeave;
