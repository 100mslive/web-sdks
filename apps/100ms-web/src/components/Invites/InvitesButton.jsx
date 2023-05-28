import { InviteUsers } from "@100mslive/react-icons";
import { Button, Tooltip } from "@100mslive/react-ui";
import {
  useIsSidepaneTypeOpen,
  useSidepaneToggle,
} from "../AppData/useSidepane";
import { SIDE_PANE_OPTIONS } from "../../common/constants";

const InvitesButton = () => {
  const toggleInvites = useSidepaneToggle(SIDE_PANE_OPTIONS.INVITES);
  const isInvitePaneOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.INVITES);
  return (
    <Tooltip title="Invite">
      <Button
        data-testid="go_live"
        variant="standard"
        onClick={() => {
          toggleInvites();
        }}
        disabled={isInvitePaneOpen}
        icon
      >
        <InviteUsers />
        Invite
      </Button>
    </Tooltip>
  );
};

export default InvitesButton;
