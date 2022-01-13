import React, { useState } from "react";
import { IconButton, Tooltip } from "@100mslive/react-ui";
import { PipIcon } from "@100mslive/react-icons";
import ActivatedPIP from "./ActivatedPIP";
import { PictureInPicture } from "./PIPManager";

/**
 * shows a button which when clicked shows some videos in PIP, clicking
 * again turns it off.
 */
const PIPComponent = () => {
  const [isPipOn, setIsPipOn] = useState(PictureInPicture.isOn());

  if (!PictureInPicture.isSupported()) {
    return null;
  }

  return (
    <div className="md:block hidden">
      <Tooltip
        title={`${isPipOn ? "Deactivate" : "Activate"} Person in Person view`}
      >
        <IconButton
          active={!isPipOn}
          key="pip"
          onClick={() => setIsPipOn(!isPipOn)}
        >
          <PipIcon width={32} height={32} />
        </IconButton>
      </Tooltip>
      {isPipOn && <ActivatedPIP setIsPipOn={setIsPipOn} />}
    </div>
  );
};

export default PIPComponent;
