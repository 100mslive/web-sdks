import React, { Fragment, useState } from "react";
import { useScreenShare } from "@100mslive/react-sdk";
import {
  PdfShare,
  ScreenShare,
  StarIcon,
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
import { ShareMenuIcon } from "../ScreenShare";
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
          <ShareMenuIcon disabled={amIScreenSharing}>
            <Tooltip title="Share">
              <Box>
                <VerticalMenuIcon />
              </Box>
            </Tooltip>
          </ShareMenuIcon>
        </Dropdown.Trigger>
        <Dropdown.Content
          sideOffset={5}
          css={{
            w: "$96",
            maxHeight: "$96",
          }}
        >
          <Dropdown.Item
            css={{
              flexDirection: "column",
              alignItems: "flex-start",
              "&:hover": {
                backgroundColor: "transparent",
                cursor: "default",
              },
            }}
          >
            <Text variant="h6">Start Sharing</Text>
            <Text variant="sm">Choose what you want to share</Text>
          </Dropdown.Item>
          <Dropdown.Item
            css={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: "$8",
              "&:hover": {
                backgroundColor: "transparent",
                cursor: "default",
              },
            }}
          >
            <Flex
              direction="column"
              align="center"
              css={{
                gap: "$6",
              }}
            >
              <IconButton
                as="div"
                onClick={() => toggleScreenShare()}
                css={{
                  p: "$6",
                  display: "flex",
                  justifyContent: "center",
                  border: "1px solid $grayDefault",
                  borderRadius: "$2",
                  backgroundColor: "$surfaceLighter",
                  pb: "0",
                }}
                icon
              >
                <ScreenShare
                  width="100%"
                  height="100%"
                  style={{
                    borderTopLeftRadius: "4px",
                    borderTopRightRadius: "4px",
                  }}
                />
              </IconButton>
              <Flex direction="column" align="center">
                <Text variant="body2">Share Screen</Text>
                <Text
                  variant="caption"
                  css={{
                    color: "$textDisabled",
                    textAlign: "center",
                  }}
                >
                  Share your tab, window or your entire screen
                </Text>
              </Flex>
            </Flex>
            <Flex
              direction="column"
              align="center"
              css={{
                gap: "$6",
              }}
            >
              <IconButton
                onClick={() => {
                  updateState(MODALS.PDF_SHARE, true);
                }}
                disabled={amIScreenSharing}
                css={{
                  p: "$6",
                  display: "flex",
                  justifyContent: "center",
                  border: "$grayDefault 1px solid",
                  borderRadius: "$2",
                  backgroundColor: "$surfaceLight",
                  pb: "0",
                }}
                icon
              >
                <PdfShare
                  width="100%"
                  height="100%"
                  style={{
                    borderTopLeftRadius: "4px",
                    borderTopRightRadius: "4px",
                  }}
                />
                <Flex
                  direction="row"
                  css={{
                    position: "absolute",
                    top: "29%",
                    left: "54%",
                    padding: "$2 $4",
                    borderRadius: "$2",
                    backgroundColor: "$primaryLight",
                    zIndex: "2",
                  }}
                >
                  <IconButton
                    css={{
                      w: "$10",
                      h: "$8",
                      "&:hover": {
                        backgroundColor: "transparent !important",
                        border: "none",
                      },
                    }}
                    icon
                  >
                    <StarIcon />
                  </IconButton>
                  <Text
                    variant="xs"
                    css={{
                      fontWeight: "$semiBold",
                      color: "$white",
                      pr: "$4",
                    }}
                  >
                    New
                  </Text>
                </Flex>
              </IconButton>
              <Flex direction="column" align="center">
                <Text variant="body2">Share PDF</Text>
                <Text
                  variant="caption"
                  css={{
                    color: "$textDisabled",
                    textAlign: "center",
                  }}
                >
                  Annotate, draw shapes, and more over PDFs
                </Text>
              </Flex>
            </Flex>
          </Dropdown.Item>
          <Dropdown.Item
            css={{
              "&:hover": {
                backgroundColor: "transparent",
                cursor: "default",
              },
            }}
          >
            <Button
              variant="standard"
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
