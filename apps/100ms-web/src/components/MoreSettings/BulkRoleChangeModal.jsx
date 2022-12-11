import React, { useCallback, useState } from "react";
import { useHMSActions } from "@100mslive/react-sdk";
import { ChangeRoleIcon } from "@100mslive/react-icons";
import { Button, Dialog } from "@100mslive/react-ui";
import {
  DialogContent,
  DialogRow,
  DialogSelect,
} from "../../primitives/DialogContent";
import { useFilteredRoles } from "../../common/hooks";

export const BulkRoleChangeModal = ({ onOpenChange }) => {
  const roles = useFilteredRoles();
  const hmsActions = useHMSActions();
  const [selectBulkRole, setBulkRole] = useState([]);
  const [selectedRole, setRole] = useState();

  const changeBulkRole = useCallback(async () => {
    await hmsActions.changeRoleOfPeersWithRoles({
      roles: selectBulkRole,
      toRole: selectedRole,
    });
    onOpenChange(false);
  }, [selectedRole, selectBulkRole, hmsActions]);

  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <DialogContent title="Bulk Role Change" Icon={ChangeRoleIcon}>
        <DialogSelect
          title="From Roles"
          options={[...roles.map(role => ({ label: role, value: role }))]}
          selected={setBulkRole}
          keyField="value"
          labelField="label"
          onChange={selectBulkRole}
        />
        <DialogSelect
          title="To Role"
          options={[...roles.map(role => ({ label: role, value: role }))]}
          selected={selectedRole}
          keyField="value"
          labelField="label"
          onChange={setRole}
        />
        <DialogRow justify="end">
          <Button variant="primary" onClick={changeBulkRole}>
            Apply
          </Button>
        </DialogRow>
      </DialogContent>
    </Dialog.Root>
  );
};
