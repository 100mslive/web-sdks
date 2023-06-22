import {
  InteractionClosedIcon,
  InteractionOpenIcon,
} from "@100mslive/react-icons";
import { Tooltip } from "@100mslive/react-ui";
import IconButton from "../IconButton";
import {
  useIsSidepaneTypeOpen,
  useSidepaneToggle,
} from "./AppData/useSidepane";
import { SIDE_PANE_OPTIONS } from "./../common/constants";

const GetWidgetsButton = () => {
  const isWidgetsMenuOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.WIDGET);
  const toggleWidgets = useSidepaneToggle(SIDE_PANE_OPTIONS.WIDGET);

  return (
    <Tooltip title="Toggle Widget Menu">
      <IconButton
        data-testid="get_widgets"
        onClick={() => {
          toggleWidgets();
          window.sessionStorage.setItem("userOpenedWidgetsMenu", "true");
        }}
        icon
      >
        {isWidgetsMenuOpen ? (
          <InteractionOpenIcon />
        ) : (
          <InteractionClosedIcon />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default GetWidgetsButton;
