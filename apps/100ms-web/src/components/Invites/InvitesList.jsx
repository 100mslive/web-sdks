import React, { Fragment, useState } from "react";
import { useMedia } from "react-use";
import { selectRoomID, useHMSStore } from "@100mslive/react-sdk";
import { CopyIcon, CrossIcon, ShareLink } from "@100mslive/react-icons";
import {
  Box,
  Button,
  config as cssConfig,
  Flex,
  IconButton,
  Text,
} from "@100mslive/react-ui";
import { useSidepaneToggle } from "../AppData/useSidepane";
import { useFilteredRoles } from "../../common/hooks";
import { SIDE_PANE_OPTIONS } from "../../common/constants";

export const InvitesList = () => {
  const roleNames = useFilteredRoles();

  const roomId = useHMSStore(selectRoomID);
  const cards = roleNames.map(roleName => getCardData(roleName, roomId));
  const toggleSidepane = useSidepaneToggle(SIDE_PANE_OPTIONS.INVITES);

  return (
    <Fragment>
      <Flex css={{ w: "100%", py: "$8" }}>
        <Box css={{ flex: "1 1 0", mx: "$8" }}>
          <Text variant="tiny">INVITE PEOPLE</Text>
          <Text variant="h6">Your meeting's ready</Text>
        </Box>
        <IconButton
          onClick={toggleSidepane}
          css={{ alignSelf: "flex-start" }}
          data-testid="close_streaming"
        >
          <CrossIcon />
        </IconButton>
      </Flex>
      <Flex
        direction="column"
        css={{ w: "100%", gap: "$10", overflowY: "auto", mb: "$10" }}
      >
        {cards.map(card => (
          <Card key={card.title} {...card} />
        ))}
      </Flex>
    </Fragment>
  );
};

const getCardData = (roleName, roomId) => {
  let data = {};
  const formattedRoleName = roleName[0].toUpperCase() + roleName.slice(1);
  data["title"] = formattedRoleName;
  data["link"] = `/${roomId}/${roleName}`;
  return data;
};

const Card = ({ title, link, order = 0 }) => {
  const [copied, setCopied] = useState(false);
  const isMobile = useMedia(cssConfig.media.md);
  const handleShare = shareData => {
    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => {
          console.log("Share successful");
        })
        .catch(error => {
          console.error("Error sharing:", error);
        });
    } else {
      console.log("Web Share API not supported");
    }
  };
  return (
    <Box
      key={title}
      css={{
        backgroundColor: "$surfaceLight",
        padding: "$10",
        order,
        borderRadius: "$2",
      }}
    >
      <Flex align="baseline" gap="2" css={{ color: "$primaryLight" }}>
        <Text variant="h6" css={{ fontWeight: "$semiBold", flexGrow: "1" }}>
          {title}
        </Text>
        <Button
          variant="standard"
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}${link}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          css={{ r: "$1", mt: "$10", fontWeight: "$semiBold" }}
          icon
        >
          {copied ? (
            <>Link copied!</>
          ) : (
            <>
              <CopyIcon style={{ color: "inherit" }} />
              Copy Link
            </>
          )}
        </Button>
        {isMobile && (
          <Button
            variant="standard"
            onClick={() => {
              const shareData = {
                title: title,
                text: `Join as ${title}`,
                url: `${window.location.origin}${link}`,
              };
              handleShare(shareData);
            }}
            css={{ r: "$1", mt: "$10", fontWeight: "$semiBold" }}
            icon
          >
            <ShareLink style={{ color: "inherit" }} />
          </Button>
        )}
      </Flex>
    </Box>
  );
};
