import React, { Fragment, useState } from "react";
import { useScreenShare } from "@100mslive/react-sdk";
import {
  PdfShare,
  ScreenShare,
  VerticalMenuIcon,
} from "@100mslive/react-icons";
import {
  Box,
  Button,
  Dropdown,
  Flex,
  IconButton,
  Text,
  Tooltip,
} from "@100mslive/react-ui";
import { PDFFileOptions } from "./pdfFileOptions";

const MODALS = {
  SHARE: "share",
  SCREEN_SHARE: "screenShare",
  PDF_SHARE: "pdfShare",
};

export function ShareScreenOptions() {
  const [openModals, setOpenModals] = useState(new Set());
  const { amIScreenSharing } = useScreenShare();
  const updateState = (modalName, value) => {
    setOpenModals(modals => {
      const copy = new Set(modals);
      if (value) {
        copy.add(modalName);
      } else {
        copy.delete(modalName);
      }
      return copy;
    });
  };
  const { toggleScreenShare } = useScreenShare();
  return (
    <Fragment>
      <Dropdown.Root
        open={openModals.has(MODALS.SHARE)}
        onOpenChange={value => updateState(MODALS.SHARE, value)}
      >
        <Dropdown.Trigger asChild data-testid="sharing_btn">
          <IconButton>
            <Tooltip title="Share">
              <Box>
                <VerticalMenuIcon />
              </Box>
            </Tooltip>
          </IconButton>
        </Dropdown.Trigger>
        <Dropdown.Content
          sideOffset={5}
          css={{
            w: "$96",
            h: "24rem",
          }}
        >
          <Dropdown.Item
            css={{
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <Text variant="h6">Start Sharing</Text>
            <Text variant="sm">Choose what you want to share</Text>
          </Dropdown.Item>
          <Dropdown.Item
            css={{
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            <Flex direction="column" align="center">
              <IconButton
                as="div"
                onClick={() => toggleScreenShare()}
                css={{
                  p: "$4",
                  display: "flex",
                  justifyContent: "center",
                  border: "gray 1px solid",
                  borderRadius: "$2",
                  backgroundColor: "#282F39",
                }}
                icon
              >
                <ScreenShare width="135px" height="84px" />
              </IconButton>

              <Text variant="sub1">Share Screen</Text>
              <Text variant="caption">
                Share your tab, window, or entire screen.
              </Text>
            </Flex>
            <Flex direction="column" align="center">
              <IconButton
                onClick={() => {
                  if (!amIScreenSharing) {
                    updateState(MODALS.PDF_SHARE, true);
                  }
                }}
                css={{
                  p: "$4",
                  display: "flex",
                  justifyContent: "center",
                  border: "gray 1px solid",
                  borderRadius: "$2",
                  backgroundColor: "#282F39",
                }}
                icon
              >
                <PdfShare width="135px" height="84px" />
              </IconButton>
              <Text variant="sub1">Share PDF</Text>
              <Text variant="caption">Annotate, share and more over PDFs</Text>
            </Flex>
          </Dropdown.Item>
          <Dropdown.Item>
            <Button
              variant="primary"
              outlined
              type="submit"
              onClick={() => {
                updateState(MODALS.SHARE, false);
              }}
              data-testid="share_btn"
              css={{
                w: "100%",
              }}
            >
              Cancel
            </Button>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Root>
      {openModals.has(MODALS.PDF_SHARE) && (
        <PDFFileOptions
          onOpenChange={value => updateState(MODALS.PDF_SHARE, value)}
        />
      )}
    </Fragment>
  );
}
