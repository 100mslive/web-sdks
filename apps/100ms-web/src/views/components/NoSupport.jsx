import React, { useEffect, useState } from "react";
import { Dialog, Text } from "@100mslive/react-ui";
import { parsedUserAgent } from "@100mslive/react-sdk";

export const NoSupport = () => {
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    const browser = parsedUserAgent.getBrowser();
    if (browser.name?.toLowerCase().includes("miui")) {
      setShowModal(true);
    }
  }, []);

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <Dialog.Content
        title="Browser not supported"
        onInteractOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
        onPointerDownOutside={e => e.preventDefault()}
        close={false}
      >
        <Text variant="body">
          This browser is not supported. Please use Google Chrome or Firefox.
        </Text>
      </Dialog.Content>
    </Dialog>
  );
};
