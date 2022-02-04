import React, { useState, useEffect } from "react";
import { Dialog, Text } from "@100mslive/react-ui";

export const InvalidRoleModal = ({ notification }) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (notification?.data?.description.includes("role is invalid")) {
      setShowModal(true);
    }
  }, [notification]);
  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <Dialog.Content
        title="Invalid Role"
        onInteractOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
        onPointerDownOutside={e => e.preventDefault()}
      >
        <Text variant="body">
          Invalid Role. The role does not exist for the given room. Try again
          with valid role.
        </Text>
      </Dialog.Content>
    </Dialog>
  );
};
