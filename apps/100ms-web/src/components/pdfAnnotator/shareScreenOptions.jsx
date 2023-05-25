import React from "react";
import { useScreenShare } from "@100mslive/react-sdk";
import { Box, Button, Dialog, Flex, Text } from "@100mslive/react-ui";
import { DialogContent, DialogRow } from "../../primitives/DialogContent";
import { HorizontalMenuIcon } from "@100mslive/react-icons";

const MODALS = {
  "SHARE": "share",
  "SCREEN_SHARE": "screenShare",
  "PDF_SHARE": "pdfShare",
}

export function ShareScreenOptions({ onOpenChange }) {
  const [openModals, setOpenModals] = useState(new Set());
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
        <Dropdown.Trigger asChild data-testid="more_settings_btn">
          <IconButton>
            <Tooltip title="More options">
              <Box>
                <HorizontalMenuIcon />
              </Box>
            </Tooltip>
          </IconButton>
        </Dropdown.Trigger>
        <Dropdown.Content></Dropdown.Content>
      </Dropdown.Root>
    </Fragment>
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <DialogContent title="Start Sharing">
        <DialogRow>
          <Text variant="sm">Choose what you want to share.</Text>
        </DialogRow>
        <DialogRow>
          <Flex direction="row">
            <Flex direction="column" align="center">
              <Box
                onClick={console.log("here")}
                css={{
                  p: "$4",
                  display: "flex",
                  justifyContent: "center",
                  border: "gray 1px solid",
                  borderRadius: "$2",
                  backgroundColor: "#282F39",
                }}
              >
                <img
                  src="/screenShare.png"
                  alt="Share screen to user"
                  style={{
                    borderRadius: "$4 $4 0 0",
                  }}
                />
              </Box>

              <Text>Share Screen</Text>
              <Text variant="sm">
                {" "}
                Share your tab, window, or entire screen.
              </Text>
            </Flex>
            <Flex direction="column" align="center">
              <Box
                css={{
                  p: "$4",
                  display: "flex",
                  justifyContent: "center",
                  border: "gray 1px solid",
                  borderRadius: "$2",
                  backgroundColor: "#282F39",
                }}
              >
                <img
                  src="/pdfShare.png"
                  alt="Share pdf to user"
                  style={{
                    borderRadius: "$4 $4 0 0",
                  }}
                />
              </Box>
              <Text>Share PDF</Text>
              <Text variant="sm">Annotate, share and more over PDFs</Text>
            </Flex>
          </Flex>
        </DialogRow>
        <DialogRow>
          <Button
            variant="primary"
            outlined
            type="submit"
            onClick={() => {
              onOpenChange(false);
            }}
            data-testid="share_btn"
          >
            Cancel
          </Button>
        </DialogRow>
      </DialogContent>
    </Dialog.Root>
  );
}
