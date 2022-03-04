import { useCallback, useRef, useState, useEffect } from "react";
import {
  useHMSActions,
  useHMSStore,
  useHMSNotifications,
  selectIsLocalAudioPluginPresent, useDevices,
  selectLocalAudioTrackID,
} from '@100mslive/react-sdk';
import { AudioLevelIcon } from "@100mslive/react-icons";
import { IconButton, Tooltip } from "@100mslive/react-ui";
import { HMSNoiseSuppressionPlugin } from "@100mslive/hms-noise-suppression";
import { hmsToast } from "../src/views/components/notifications/hms-toast";

export const NoiseSuppression = () => {
  const pluginRef = useRef(null);
  const hmsActions = useHMSActions();
  const [disable, setDisabled] = useState(false);
  const isPluginPresent = useHMSStore(
    selectIsLocalAudioPluginPresent("@100mslive/hms-noise-suppression")
  );
  const { selectedDeviceIDs } = useDevices();
  const pluginActive = isPluginPresent && !disable;

  // const localAudioTrackID = useHMSStore(selectLocalAudioTrackID);
  // // const notification = useHMSNotifications();

  const createPlugin = () => {
    if (!pluginRef.current) {
      pluginRef.current = new HMSNoiseSuppressionPlugin(
        process.env.NS_DURATION_TIME_IN_MS
      );
    }
  };

  const removePlugin = useCallback(async () => {
    if (pluginRef.current) {
      await hmsActions.removePluginFromAudioTrack(pluginRef.current);
      pluginRef.current = null;
    }
  }, [hmsActions]);

  const cleanup = useCallback(
    async err => {
      if(err.message){
        hmsToast(err.message);
      }else{
        hmsToast(err);
      }

      setDisabled(true);
      await removePlugin();
      pluginRef.current = null;
      console.error(err);
    },
    [removePlugin]
  );

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
  }, [hmsActions, cleanup]);

  useEffect(() => {
    if(pluginRef.current){
      const supported = hmsActions.validateAudioPluginSupport(
        pluginRef.current
      );
      if(supported.isSupported){
        console.log("inside device change supported");
        setDisabled(false);
      }else{
        console.log("inside device change not supported");
        setDisabled(true);
      }
    }

  }, [selectedDeviceIDs.audioInput]);

  //Commenting by default NS add since its causing audio issues
/*  useEffect(() => {
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
