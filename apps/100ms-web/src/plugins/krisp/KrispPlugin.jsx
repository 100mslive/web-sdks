import { AudioLevelIcon } from "@100mslive/react-icons";
import {
  selectIsLocalAudioPluginPresent,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { IconButton, Tooltip } from "@100mslive/react-ui";
import { useCallback, useRef } from "react";
import FilterFactory from "./krispsdk.mjs";

const ncOptions = {
  modelOption: FilterFactory.ModelOptions.model_32,
  processor: "./krisp.processor.js",
  model_32: "./weights/model_32.kw",
};

class Plugin {
  ncFilter;
  checkSupport() {
    return { isSupported: true };
  }

  async processAudioTrack(ctx, source) {
    if (!ctx) {
      throw new Error("Audio context is not created");
    }
    if (!source) {
      throw new Error("source is not defined");
    }
    const ncFilter = await FilterFactory.create(ctx, ncOptions);
    source.connect(ncFilter);
    this.ncFilter = ncFilter;
    return ncFilter;
  }

  init() {}

  getName() {
    return "KrispPlugin";
  }

  getPluginType() {
    return "TRANSFORM";
  }

  stop() {
    this.ncFilter?.disconnect();
    this.ncFilter = undefined;
  }
}

export const KrispPlugin = () => {
  const isPluginPresent = useHMSStore(
    selectIsLocalAudioPluginPresent("KrispPlugin")
  );
  const actions = useHMSActions();
  const pluginRef = useRef(null);

  const addPlugin = useCallback(() => {
    pluginRef.current = new Plugin();
    actions.addPluginToAudioTrack(pluginRef.current);
  }, [actions]);

  const removePlugin = useCallback(() => {
    if (pluginRef.current) {
      actions.removePluginFromAudioTrack(pluginRef.current);
    }
  }, [actions]);

  return (
    <Tooltip
      title={`Turn ${!isPluginPresent ? "on" : "off"} krisp noise suppression`}
    >
      <IconButton
        active={!isPluginPresent}
        onClick={async () => {
          if (!isPluginPresent) {
            await addPlugin();
          } else {
            await removePlugin();
          }
        }}
        css={{ mx: "$4" }}
        data-testid="noise_suppression_btn"
      >
        <AudioLevelIcon />
      </IconButton>
    </Tooltip>
  );
};
