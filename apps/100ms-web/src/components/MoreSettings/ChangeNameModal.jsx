import React, { useState } from "react";
import {
  useHMSActions,
  useHMSStore,
  selectLocalPeerName,
} from "@100mslive/react-sdk";
import { Dialog, Flex, Button, Text, Box, Input } from "@100mslive/react-ui";
import {
  useUserPreferences,
  UserPreferencesKeys,
} from "../hooks/useUserPreferences";
import { ToastManager } from "../Toast/ToastManager";
import { DialogRow } from "../../primitives/DialogContent";
export const ChangeNameModal = ({ onOpenChange }) => {
  const [previewPreference, setPreviewPreference] = useUserPreferences(
    UserPreferencesKeys.PREVIEW
  );
  const hmsActions = useHMSActions();
  const localPeerName = useHMSStore(selectLocalPeerName);
  const [currentName, setCurrentName] = useState(localPeerName);

  const changeName = async () => {
    const name = currentName.trim();
    if (!name || name === localPeerName) {
      return;
    }
    try {
      await hmsActions.changeName(name);
      setPreviewPreference({
        ...(previewPreference || {}),
        name,
      });
    } catch (error) {
      console.error("failed to update name", error);
      ToastManager.addToast({ title: error.message });
    } finally {
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <Dialog.Overlay />
      <Dialog.Content css={{ width: "min(400px,80%)", p: "$10" }}>
        <Dialog.Title css={{ p: "0 $4" }}>
          <Text variant="h6"> Change Name</Text>
        </Dialog.Title>
        <form
          onSubmit={e => {
            e.preventDefault();
          }}
        >
          <Flex justify="center" align="center" css={{ my: "$8", w: "100%" }}>
            <Input
              css={{ width: "100%" }}
              value={currentName}
              onChange={e => {
                setCurrentName(e.target.value);
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
              flexDirection: "row",
              gap: "$md",
              margin: "$10 0 0 0",
            }}
          >
            <Box css={{ w: "50%" }}>
              <Dialog.Close css={{ w: "100%" }}>
                <Button
                  variant="standard"
                  css={{ w: "100%" }}
                  outlined
                  type="submit"
                  disabled={!localPeerName}
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
                  !currentName.trim() || currentName.trim() === localPeerName
                }
                onClick={async () => {
                  await changeName();
                }}
                data-testid="popup_change_btn"
              >
                Change
              </Button>
            </Box>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};
