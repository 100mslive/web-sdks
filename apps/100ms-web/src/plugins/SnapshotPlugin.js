import { useEffect, useRef } from "react";
import { CameraFlipIcon } from "@100mslive/react-icons";
import {
  HMSVideoPluginType,
  selectIsLocalVideoPluginPresent,
  selectLocalVideoTrackID,
  useCustomEvent,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import IconButton from "../IconButton";
import { createSnapshotFromCanvas } from "../common/utils";

export class SnapshotPlugin {
  name = "SnapshotPlugin";
  inputCanvas;
  getName() {
    return this.name;
  }

  checkSupport() {
    return { isSupported: true };
  }

  isSupported() {
    return true;
  }

  async init() {}

  getPluginType() {
    return HMSVideoPluginType.TRANSFORM;
  }

  stop() {}

  /**
   * @param input {HTMLCanvasElement}
   * @param output {HTMLCanvasElement}
   */
  processVideoFrame(input, output) {
    this.input = input;
    output.width = input.width;
    output.height = input.height;
    output.getContext("2d").drawImage(input, 0, 0, input.width, input.height);
  }

  captureSnapshot() {
    if (!this.input) {
      throw Error("This method can only be called after plugin is added");
    }
    createSnapshotFromCanvas(this.input);
  }
}

const SnapshotPluginInstance = new SnapshotPlugin();

export const Snapshot = () => {
  const hmsActions = useHMSActions();
  const isSnapshotPluginPresent = useHMSStore(
    selectIsLocalVideoPluginPresent(SnapshotPluginInstance.getName())
  );
  const localVideoTrackID = useHMSStore(selectLocalVideoTrackID);
  const inProgress = useRef(false);
  useCustomEvent({
    type: "CAPTURE_SNAPSHOT",
    onEvent: () => {
      if (isSnapshotPluginPresent) {
        SnapshotPluginInstance.captureSnapshot();
      }
    },
  });

  useEffect(() => {
    if (!localVideoTrackID || inProgress.current) {
      return;
    }
    const addPlugin = async () => {
      await hmsActions.addPluginToVideoTrack(SnapshotPluginInstance);
    };
    const removePlugin = async () => {
      if (SnapshotPluginInstance) {
        await hmsActions.removePluginFromVideoTrack(SnapshotPluginInstance);
      }
    };
    inProgress.current = true;
    addPlugin().then(() => {
      inProgress.current = false;
    });
    return () => {
      if (isSnapshotPluginPresent) {
        removePlugin();
      }
    };
  }, [hmsActions, localVideoTrackID, isSnapshotPluginPresent]);

  return (
    <IconButton
      active={!isSnapshotPluginPresent}
      disabled={!isSnapshotPluginPresent}
    >
      <CameraFlipIcon />
    </IconButton>
  );
};
