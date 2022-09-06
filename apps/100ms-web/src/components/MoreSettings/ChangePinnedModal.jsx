import React, { useState } from "react";
import { Dialog, Flex, Button, Text, Box, Input } from "@100mslive/react-ui";
import { ToastManager } from "../Toast/ToastManager";

export const ChangePinnedTextModal = ({
  onOpenChange,
  pinnedText,
  changePinnedText,
}) => {
  const [currentPinnedText, setCurrentPinnedText] = useState(pinnedText || "");

  const setPinnedText = async () => {
    const trimmedText = currentPinnedText.trim();
    if (!trimmedText || trimmedText === pinnedText) {
      return;
    }
    try {
      await changePinnedText(trimmedText);
    } catch (error) {
      console.error("failed to update pinned text", error);
      ToastManager.addToast({ title: error.message });
    } finally {
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content css={{ width: "min(600px,80%)", p: "$10" }}>
          <Dialog.Title css={{ p: "0 $4" }}>
            <Text variant="h6">Change Pinned Text</Text>
          </Dialog.Title>
          <form
            onSubmit={e => {
              e.preventDefault();
              setPinnedText();
            }}
          >
            <Flex justify="center" align="center" css={{ my: "$8", w: "100%" }}>
              <Input
                css={{ width: "100%" }}
                value={currentPinnedText}
                onChange={e => {
                  setCurrentPinnedText(e.target.value);
                }}
                autoComplete="name"
                required
                data-testid="change_name_field"
              />
            </Flex>

            <Flex
              justify="between"
              align="center"
              css={{
                width: "100%",
                gap: "$md",
                mt: "$10",
              }}
            >
              <Box css={{ w: "50%" }}>
                <Dialog.Close css={{ w: "100%" }}>
                  <Button
                    variant="standard"
                    css={{ w: "100%" }}
                    outlined
                    type="submit"
                  >
                    Cancel
                  </Button>
                </Dialog.Close>
              </Box>
              <Box css={{ w: "50%" }}>
                <Button
                  variant="primary"
                  css={{ width: "100%" }}
                  type="submit"
                  disabled={
                    !currentPinnedText.trim() ||
                    currentPinnedText.trim() === pinnedText
                  }
                  onClick={setPinnedText}
                  data-testid="popup_change_btn"
                >
                  Change
                </Button>
              </Box>
            </Flex>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
