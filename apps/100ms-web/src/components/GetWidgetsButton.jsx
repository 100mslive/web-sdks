import {
  InteractionClosedIcon,
  InteractionOpenIcon,
} from "@100mslive/react-icons";
import { Tooltip } from "@100mslive/react-ui";
import IconButton from "../IconButton";
import { useWidgetToggle } from "./AppData/useSidepane";
import { useWidgetState } from "./AppData/useUISettings";

const GetWidgetsButton = () => {
  const toggleWidgets = useWidgetToggle();
  const { widgetView } = useWidgetState();

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
        {widgetView ? <InteractionOpenIcon /> : <InteractionClosedIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default GetWidgetsButton;
