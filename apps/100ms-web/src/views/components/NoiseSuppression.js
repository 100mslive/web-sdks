import { useCallback, useRef, useState, useEffect } from "react";
import {
  useHMSActions,
  useHMSStore,
  useHMSNotifications,
  HMSNotificationTypes,
  selectIsLocalAudioPluginPresent,
  selectIsAllowedToPublish,
  // selectLocalAudioTrackID,
} from "@100mslive/react-sdk";
import { AudioLevelIcon } from "@100mslive/react-icons";
import { IconButton, Tooltip } from "@100mslive/react-ui";
import { HMSNoiseSuppressionPlugin } from "@100mslive/hms-noise-suppression";
import { hmsToast } from "./notifications/hms-toast";

const BUFFER_DURATION = 80;

export const NoiseSuppression = () => {
  const pluginRef = useRef(null);
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const hmsActions = useHMSActions();
  const [removeButton, setRemoveButton] = useState(false);
  const isPluginPresent = useHMSStore(
    selectIsLocalAudioPluginPresent("@100mslive/hms-noise-suppression")
  );
  const pluginActive = isPluginPresent && !removeButton;

  // const localAudioTrackID = useHMSStore(selectLocalAudioTrackID);
  const notification = useHMSNotifications();

  const createPlugin = () => {
    if (!pluginRef.current) {
      pluginRef.current = new HMSNoiseSuppressionPlugin(BUFFER_DURATION);
    }
  };

  const addPlugin = useCallback(async () => {
    try {
      setRemoveButton(false);
      createPlugin();
      //check support its recommended
      const pluginSupport = hmsActions.validateAudioPluginSupport(
        pluginRef.current
      );
      if (pluginSupport.isSupported) {
        console.log("noise suppression plugin is supported");
        await hmsActions.addPluginToAudioTrack(pluginRef.current);
      } else {
        const err = pluginSupport.errMsg;
        hmsToast(pluginSupport.errMsg);
        setRemoveButton(true);
        pluginRef.current = null;
        console.error(err);
      }
    } catch (err) {
      hmsToast(err.message);
      setRemoveButton(true);
      pluginRef.current = null;
      console.error(err);
    }
  }, [hmsActions]);

  useEffect(() => {
    if (!notification) {
      return;
    }
    if (
      notification.type === HMSNotificationTypes.DEVICE_CHANGE_UPDATE &&
      notification.data.type === "audioInput"
    ) {
      setRemoveButton(false);
    }

    if (
      notification.type === HMSNotificationTypes.ERROR &&
      notification.data?.code === 7005 //error code = 7005 for NoiseSuppression plugin support failure
    ) {
      setRemoveButton(true);
    }
  }, [notification]);

  //Commenting by default NS add since its causing audio issues
  /*useEffect(() => {
    if (
      !notification ||
      notification.type !== HMSNotificationTypes.TRACK_ADDED ||
      notification.data?.id !== localAudioTrackID
    ) {
      return;
    }
    if (process.env.REACT_APP_ENV === "qa") {
      addPlugin();
    } else {
      createPlugin();
    }
  }, [addPlugin, notification, localAudioTrackID]);*/

  async function removePlugin() {
    if (pluginRef.current) {
      console.log("remove plugin called");
      await hmsActions.removePluginFromAudioTrack(pluginRef.current);
      pluginRef.current = null;
    }
  }

  if (!isAllowedToPublish.audio || pluginRef.current) {
    return null;
  }

  return (
    <Tooltip title={`Turn ${!pluginActive ? "on" : "off"} noise suppression`}>
      <IconButton
        active={!pluginActive}
        disabled={removeButton}
        onClick={async () => {
          if (!pluginActive) {
            await addPlugin();
          } else {
            await removePlugin();
          }
        }}
        css={{ ml: "$4", "@md": { display: "none" } }}
      >
        <AudioLevelIcon />
      </IconButton>
    </Tooltip>
  );
};
