import {
  InteractionClosedIcon,
  InteractionOpenIcon,
} from "@100mslive/react-icons";
import { Button, Tooltip } from "@100mslive/react-ui";
import {
  useIsSidepaneTypeOpen,
  useSidepaneToggle,
} from "./AppData/useSidepane";
import { SIDE_PANE_OPTIONS } from "./../common/constants";

const GetWidgetsButton = () => {
  const isWidgetsMenuOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.WIDGET);
  const toggleWidgets = useSidepaneToggle(SIDE_PANE_OPTIONS.WIDGET);
  let tooltipText = "Toggle Widget Menu";

  return (
    <Tooltip title={tooltipText}>
      <Button
        data-testid="get_widgets"
        variant={isWidgetsMenuOpen ? "standard" : "primary"}
        onClick={() => {
          toggleWidgets();
          window.sessionStorage.setItem("userOpenedWidgetsMenu", "true");
        }}
        icon
        disabled={isWidgetsMenuOpen}
      >
        {isWidgetsMenuOpen ? (
          <InteractionOpenIcon />
        ) : (
          <InteractionClosedIcon />
        )}
      </Button>
    </Tooltip>
  );
};

export default GetWidgetsButton;
