import { Fragment, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import {
  selectPermissions,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { HangUpIcon } from "@100mslive/react-icons";
import {
  Button,
  Popover,
  Dialog,
  Tooltip,
  Box,
  IconButton,
  styled,
} from "@100mslive/react-ui";
import {
  DialogCheckbox,
  DialogContent,
  DialogRow,
} from "../primitives/DialogContent";

export const LeaveRoom = () => {
  const history = useHistory();
  const params = useParams();
  const [showEndRoomModal, setShowEndRoomModal] = useState(false);
  const [lockRoom, setLockRoom] = useState(false);
  const permissions = useHMSStore(selectPermissions);
  const hmsActions = useHMSActions();

  const redirectToLeavePage = () => {
    if (params.role) {
      history.push("/leave/" + params.roomId + "/" + params.role);
    } else {
      history.push("/leave/" + params.roomId);
    }
  };

  const leaveRoom = () => {
    hmsActions.leave().then(redirectToLeavePage);
  };

  const endRoom = () => {
    hmsActions.endRoom(lockRoom, "End Room").then(redirectToLeavePage);
  };
  return (
    <Fragment>
      {permissions.endRoom ? (
        <Popover.Root>
          <Popover.Trigger asChild>
            <LeaveIconButton variant="danger" key="LeaveRoom">
              <Tooltip title="Leave Room">
                <Box>
                  <HangUpIcon key="hangUp" />
                </Box>
              </Tooltip>
            </LeaveIconButton>
          </Popover.Trigger>
          <Popover.Content sideOffset={10}>
            <Button
              variant="standard"
              onClick={() => {
                setShowEndRoomModal(true);
              }}
            >
              End Room
            </Button>
            <Button variant="danger" css={{ mt: "$4" }} onClick={leaveRoom}>
              Just Leave
            </Button>
          </Popover.Content>
        </Popover.Root>
      ) : (
        <LeaveIconButton onClick={leaveRoom} variant="danger" key="LeaveRoom">
          <Tooltip title="Leave Room">
            <Box>
              <HangUpIcon key="hangUp" />
            </Box>
          </Tooltip>
        </LeaveIconButton>
      )}

      <Dialog.Root
        open={showEndRoomModal}
        onOpenChange={value => {
          if (!value) {
            setLockRoom(false);
          }
          setShowEndRoomModal(value);
        }}
      >
        <DialogContent title="End Room" Icon={HangUpIcon}>
          <DialogCheckbox
            id="lockRoom"
            title="Disable future joins"
            value={lockRoom}
            onChange={setLockRoom}
          />
          <DialogRow justify="end">
            <Button variant="danger" onClick={endRoom}>
              End Room
            </Button>
          </DialogRow>
        </DialogContent>
      </Dialog.Root>
    </Fragment>
  );
};

const LeaveIconButton = styled(IconButton, {
  color: "white",
  width: "45px",
  mx: "$4",
  bg: "$error",
  "&:not([disabled]):hover": {
    bg: "$errorTint",
  },
  "&:not([disabled]):active": {
    bg: "$errorTint",
  },
});
