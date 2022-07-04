import React, { useState } from "react";
import {
  useHMSActions,
  useHMSStore,
  selectLocalPeerName,
} from "@100mslive/react-sdk";
import { Dialog, Button, Text, Box, Input } from "@100mslive/react-ui";
import { DialogRow } from "../../primitives/DialogContent";
import {
  useUserPreferences,
  UserPreferencesKeys,
} from "../hooks/useUserPreferences";
import { ToastManager } from "../Toast/ToastManager";

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
      <Dialog.Content css={{ width: "min(400px,100%)", p: "$10" }}>
        <Dialog.Title>
          <Text variant="h6"> Change Name</Text>
        </Dialog.Title>
        <form
          onSubmit={e => {
            e.preventDefault();
          }}
        >
          <DialogRow justify="center" css={{ my: "$md" }}>
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
          </DialogRow>

          <DialogRow
            justify="between"
            css={{ width: "100%", flexDirection: "row", gap: "$md" }}
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
          </DialogRow>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};
