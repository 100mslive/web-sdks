import React from "react";
import {
  useHMSActions,
  selectRoleChangeRequest,
  useHMSStore,
} from "@100mslive/react-sdk";
import { PersonIcon } from "@100mslive/react-icons";
import { RequestDialog } from "../primitives/DialogContent";
import { useUISettings } from "./AppData/useUISettings";
import { UI_SETTINGS } from "../common/constants";

export const RoleChangeRequestModal = () => {
  const hmsActions = useHMSActions();
  const isHeadless = useUISettings(UI_SETTINGS.isHeadless);
  const roleChangeRequest = useHMSStore(selectRoleChangeRequest);

  if (!roleChangeRequest?.role || isHeadless) {
    return null;
  }

  return (
    <RequestDialog
      title="Role Change Request"
      onOpenChange={value =>
        !value && hmsActions.rejectChangeRole(roleChangeRequest)
      }
      body={`${roleChangeRequest?.requestedBy?.name} has requested you to change your role to ${roleChangeRequest?.role?.name}.`}
      onAction={() => {
        hmsActions.acceptChangeRole(roleChangeRequest);
      }}
      Icon={PersonIcon}
      actionText="Accept"
    />
  );
};
