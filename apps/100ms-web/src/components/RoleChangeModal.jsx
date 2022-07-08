import React, { useState } from "react";
import {
  useHMSStore,
  selectPeerByID,
  useHMSActions,
  selectAvailableRoleNames,
} from "@100mslive/react-sdk";
import { CheckIcon } from "@100mslive/react-icons";
import {
  Dialog,
  Button,
  Text,
  Label,
  Checkbox,
  Box,
  Flex,
  Select,
} from "@100mslive/react-ui";

export const RoleChangeModal = ({ peerId, onOpenChange }) => {
  const peer = useHMSStore(selectPeerByID(peerId));
  const roles = useHMSStore(selectAvailableRoleNames);
  const [selectedRole, setRole] = useState(peer?.roleName);
  const [requestPermission, setRequestPermission] = useState(true);
  const hmsActions = useHMSActions();
  if (!peer) {
    return null;
  }
  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <Dialog.Overlay />
      <Dialog.Content css={{ width: "min(400px,80%)", p: "$10" }}>
        <Dialog.Title css={{ p: 0 }}>
          <Text variant="h6">Change Role</Text>
          <Text
            variant="body2"
            css={{ fontWeight: 400, mt: "$4", mb: "$8", c: "$textMedEmp" }}
          >{`Change the role of "${peer?.name}" to`}</Text>
        </Dialog.Title>
        <Select.Root
          data-testid="dialog_select_rolechange"
          css={{ width: "100%", mb: "$md" }}
        >
          <Select.DefaultDownIcon />
          <Select.Select
            onChange={e => setRole(e.target.value)}
            value={selectedRole}
            css={{
              width: "100%",
              bg: "$surfaceLight",
              border: "solid $space$px $borderLight",
              textTransform: "capitalize",
            }}
          >
            {roles.map(role => {
              const id = role;
              const label = role;
              return (
                <option value={id} key={id}>
                  {label}
                </option>
              );
            })}
          </Select.Select>
        </Select.Root>
        {!peer?.isLocal && (
          <Flex justify="between" css={{ w: "100%", mb: "$10" }}>
            <Label
              htmlFor="requestRoleChangePermission"
              css={{ cursor: "pointer" }}
            >
              Request Permission
            </Label>
            <Checkbox.Root
              checked={requestPermission}
              onCheckedChange={value => setRequestPermission(value)}
              id="requestRoleChangePermission"
            >
              <Checkbox.Indicator>
                <CheckIcon width={16} height={16} />
              </Checkbox.Indicator>
            </Checkbox.Root>
          </Flex>
        )}
        <Flex
          justify="center"
          align="center"
          css={{ width: "100%", gap: "$md" }}
        >
          <Box css={{ width: "50%" }}>
            <Dialog.Close css={{ width: "100%" }}>
              <Button variant="standard" outlined css={{ width: "100%" }}>
                Cancel
              </Button>
            </Dialog.Close>
          </Box>
          <Box css={{ width: "50%" }}>
            <Button
              variant="primary"
              css={{ width: "100%" }}
              onClick={async () => {
                await hmsActions.changeRole(
                  peerId,
                  selectedRole,
                  peer.isLocal ? true : !requestPermission
                );
                onOpenChange(false);
              }}
            >
              Change
            </Button>
          </Box>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
