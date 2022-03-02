import { useCallback, useRef, useState, useEffect } from "react";
import {
  useHMSActions,
  useHMSStore,
  useHMSNotifications,
  HMSNotificationTypes,
  selectIsLocalAudioPluginPresent,
  // selectLocalAudioTrackID,
} from "@100mslive/react-sdk";
import { AudioLevelIcon } from "@100mslive/react-icons";
import { IconButton, Tooltip } from "@100mslive/react-ui";
import { HMSNoiseSuppressionPlugin } from "@100mslive/hms-noise-suppression";
import { hmsToast } from "./notifications/hms-toast";

const BUFFER_DURATION = 80;

export const NoiseSuppression = () => {
  const pluginRef = useRef(null);
  const hmsActions = useHMSActions();
  const [disable, setDisabled] = useState(false);
  const isPluginPresent = useHMSStore(
    selectIsLocalAudioPluginPresent("@100mslive/hms-noise-suppression")
  );
  const pluginActive = isPluginPresent && !disable;

  // const localAudioTrackID = useHMSStore(selectLocalAudioTrackID);
  const notificationDeviceChange = useHMSNotifications(
    HMSNotificationTypes.DEVICE_CHANGE_UPDATE
  );
  const notificationError = useHMSNotifications(HMSNotificationTypes.ERROR);

  const createPlugin = () => {
    if (!pluginRef.current) {
      pluginRef.current = new HMSNoiseSuppressionPlugin(BUFFER_DURATION);
    }
  };

  const cleanup = async err => {
    hmsToast(err);
    setDisabled(true);
    await removePlugin();
    pluginRef.current = null;
    console.error(err);
  };

  const addPlugin = useCallback(async () => {
    try {
      setDisabled(false);
      createPlugin();
      //check support its recommended
      const pluginSupport = hmsActions.validateAudioPluginSupport(
        pluginRef.current
      );
      if (pluginSupport.isSupported) {
        await hmsActions.addPluginToAudioTrack(pluginRef.current);
      } else {
        const err = pluginSupport.errMsg;
        await cleanup(err);
      }
    } catch (err) {
      await cleanup(err);
    }
  }, [hmsActions]);

  useEffect(() => {
    if (
      notificationDeviceChange &&
      notificationDeviceChange.data.type === "audioInput"
    ) {
      setDisabled(false);
    }

    if (
      notificationError &&
      notificationError.data?.code === 7005 //error code = 7005 for NoiseSuppression plugin support failure
    ) {
      setDisabled(true);
    }
  }, [notificationDeviceChange, notificationError]);

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
      await hmsActions.removePluginFromAudioTrack(pluginRef.current);
      pluginRef.current = null;
    }
  }

  return (
    <Tooltip title={`Turn ${!pluginActive ? "on" : "off"} noise suppression`}>
      <IconButton
        active={!pluginActive}
        disabled={disable}
        onClick={async () => {
          if (!pluginActive) {
            await addPlugin();
          } else {
            await removePlugin();
          }
        }}
        css={{ mx: "$4" }}
      >
        <AudioLevelIcon />
      </IconButton>
    </Tooltip>
  );
};
