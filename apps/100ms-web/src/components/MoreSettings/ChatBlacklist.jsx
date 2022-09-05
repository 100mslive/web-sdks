import React from "react";
import { selectRemotePeers, useHMSStore } from "@100mslive/react-sdk";
import { Box, Checkbox, Dialog, Text } from "@100mslive/react-ui";
import { CheckIcon, RemoveUserIcon } from "@100mslive/react-icons";
import { FixedSizeList } from "react-window";
import { useMeasure } from "react-use";
import { DialogContent, DialogRow } from "../../primitives/DialogContent";

export const ChatBlacklistModal = ({
  onOpenChange,
  blacklistedPeers,
  blacklistPeer,
}) => {
  const [ref, { width, height }] = useMeasure();
  const remotePeers = useHMSStore(selectRemotePeers);

  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <DialogContent title="Blacklist Peers from Chat" Icon={RemoveUserIcon}>
        <Box
          css={{ width: "100%", height: "$100", overflowY: "auto" }}
          ref={ref}
        >
          {remotePeers.length === 0 ? (
            <DialogRow css={{ justifyContent: "center" }}>
              No one else in room
            </DialogRow>
          ) : (
            <FixedSizeList
              itemSize={49}
              itemCount={remotePeers.length}
              width={width}
              height={height}
            >
              {({ index, style }) => {
                const peer = remotePeers[index];
                return (
                  <div style={style} key={peer.id}>
                    <DialogRow css={{ margin: "$6 0" }} key={peer.id}>
                      <Text>{peer.name}</Text>
                      <Checkbox.Root
                        checked={blacklistedPeers.includes(peer.id)}
                        onCheckedChange={checked =>
                          blacklistPeer(peer.id, checked)
                        }
                      >
                        <Checkbox.Indicator>
                          <CheckIcon width={16} height={16} />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                    </DialogRow>
                  </div>
                );
              }}
            </FixedSizeList>
          )}
        </Box>
      </DialogContent>
    </Dialog.Root>
  );
};
