import React, { useState, useEffect } from "react";
import {
  useHMSActions,
  useHMSStore,
  selectLocalPeer,
} from "@100mslive/react-sdk";
import { Dialog, Button } from "@100mslive/react-ui";
import { DialogContent, DialogInput, DialogRow } from "../new/DialogContent";
import { hmsToast } from "./notifications/hms-toast";
import {
  useUserPreferences,
  UserPreferencesKeys,
} from "../hooks/useUserPreferences";
import { TextboxIcon } from "@100mslive/react-icons";

export const ChangeName = ({ show, onToggle }) => {
  const [previewPreference, setPreviewPreference] = useUserPreferences(
    UserPreferencesKeys.PREVIEW
  );
  const hmsActions = useHMSActions();
  const localPeer = useHMSStore(selectLocalPeer);
  const [currentName, setCurrentName] = useState("");

  useEffect(() => {
    if (show) {
      setCurrentName(localPeer?.name);
    }
  }, [show, localPeer?.name]);

  const changeName = async () => {
    const name = currentName.trim();
    if (!name || name === localPeer?.name) {
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
      hmsToast(error.message);
    } finally {
      onToggle(false);
      setCurrentName("");
    }
  };

  const resetState = () => {
    onToggle(false);
    setCurrentName("");
  };

  return (
    <Dialog.Root open={show} onOpenChange={value => !value && resetState()}>
      <DialogContent title="Change my name" Icon={TextboxIcon}>
        <form
          onSubmit={e => {
            e.preventDefault();
          }}
        >
          <DialogInput
            title="Name"
            value={currentName}
            onChange={setCurrentName}
            autoComplete="name"
            required
          />
          <DialogRow justify="end">
            <Button
              variant="primary"
              type="submit"
              disabled={
                !currentName.trim() || currentName.trim() === localPeer?.name
              }
              onClick={async () => {
                await changeName();
                onToggle(false);
              }}
            >
              Change
            </Button>
          </DialogRow>
        </form>
      </DialogContent>
    </Dialog.Root>
  );
};
