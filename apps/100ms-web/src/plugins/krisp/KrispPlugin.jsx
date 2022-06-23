import { useCallback } from "react";
import {
  selectIsLocalAudioPluginPresent,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { AudioLevelIcon } from "@100mslive/react-icons";
import { IconButton, Tooltip } from "@100mslive/react-ui";
import FilterFactory from "./krispsdk.mjs";

const ncOptions = {
  modelOption: FilterFactory.ModelOptions.model_nc_auto,
  processor: "./krisp.processor.js",
  model_8: "./weights/model_8.kw", // Narrow band model path
  model_16: "./weights/model_16.kw", // Wide band model path
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
    if (!this.ncFilter) {
      this.ncFilter = await FilterFactory.create(ctx, ncOptions);
    }
    console.error(ctx.state);
    this.ncFilter.enable();
    window.ncFilter = this.ncFilter;
    source.connect(this.ncFilter);
    return this.ncFilter;
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
    this.ncFilter?.kill();
    this.ncFilter = null;
  }
}

const plugin = new Plugin();

export const KrispPlugin = () => {
  const isPluginPresent = useHMSStore(
    selectIsLocalAudioPluginPresent("KrispPlugin")
  );
  const actions = useHMSActions();

  const addPlugin = useCallback(() => {
    actions.addPluginToAudioTrack(plugin);
  }, [actions]);

  const removePlugin = useCallback(() => {
    actions.removePluginFromAudioTrack(plugin);
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
