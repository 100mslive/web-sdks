import React, { useEffect } from "react";
import {
  selectLocalPeerName,
  selectRoleChangeRequest,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Text } from "@100mslive/roomkit-react";
import { PreviewTile } from "./Preview/PreviewJoin";
import { RequestDialog } from "../primitives/DialogContent";
import { useIsHeadless } from "./AppData/useUISettings";

export const RoleChangeRequestModal = () => {
  const hmsActions = useHMSActions();
  const isHeadless = useIsHeadless();
  const roleChangeRequest = useHMSStore(selectRoleChangeRequest);
  const name = useHMSStore(selectLocalPeerName);

  useEffect(() => {
    if (!roleChangeRequest?.role || isHeadless) {
      return;
    }

    hmsActions.sdk.midCallPreview({ asRole: roleChangeRequest.role.name });

    return () => {
      hmsActions.sdk.cancelMidCallPreview();
    };
  }, [roleChangeRequest, isHeadless]);

  if (!roleChangeRequest?.role || isHeadless) {
    return null;
  }

  const body = (
    <>
      <Text>{`${roleChangeRequest?.requestedBy?.name} has requested you to change your role to ${roleChangeRequest?.role?.name}.`}</Text>
      <PreviewTile name={name} />
    </>
  );

  return (
    <RequestDialog
      title="Role Change Request"
      onOpenChange={value =>
        !value && hmsActions.rejectChangeRole(roleChangeRequest)
      }
      body={body}
      onAction={() => {
        hmsActions.acceptChangeRole(roleChangeRequest);
      }}
      actionText="Accept"
    />
  );
};
