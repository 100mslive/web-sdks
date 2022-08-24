import React from "react";
import {
  HMSVideoPluginType,
  selectIsLocalVideoPluginPresent,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { VirtualBackgroundIcon } from "@100mslive/react-icons";
import {
  Player,
  Effect,
  MediaStream as BanubaStream,
  MediaStreamCapture,
} from "./BanubaSDK.js";
import IconButton from "../../IconButton.jsx";
import { getRandomVirtualBackground } from "../VirtualBackground/vbutils.js";

class BanubaPlugin {
  player;
  name = "banuba";

  checkSupport() {
    return { isSupported: true };
  }

  init = async track => {
    this.player = await Player.create({
      clientToken:
        "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",
    });
    const effect = await Effect.preload("./effects/Background_doc.zip");
    const webar = new MediaStreamCapture(this.player);
    this.player.use(new BanubaStream(new MediaStream([track])));
    await this.player.applyEffect(effect);
    const randomBg = getRandomVirtualBackground();
    await this.player.play();
    if (randomBg === "blur") {
      await effect.evalJs("Background.blur(0.6)");
    } else {
      const filename = randomBg.substring(randomBg.lastIndexOf("/") + 1);
      const image = await fetch(randomBg).then(r => r.arrayBuffer());
      await effect.writeFile(filename, image);
      const exec = `Background.texture('${filename}')`;
      await effect.evalJs(exec);
    }
    return webar.getVideoTrack();
  };

  getPluginType() {
    return HMSVideoPluginType.TRANSFORM;
  }

  stop() {
    this.player.clearEffect();
    this.player.destroy();
  }
}

const plugin = new BanubaPlugin();
export const BanubaPluginIcon = () => {
  const actions = useHMSActions();
  const isPluginPresent = useHMSStore(
    selectIsLocalVideoPluginPresent(plugin.name)
  );
  return (
    <IconButton
      active={!isPluginPresent}
      onClick={async () => {
        if (!isPluginPresent) {
          await actions.addPluginWithTrack(plugin);
        } else {
          await actions.removePluginWithTrack(plugin);
        }
      }}
    >
      <VirtualBackgroundIcon />
    </IconButton>
  );
};
