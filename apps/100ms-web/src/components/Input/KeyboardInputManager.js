import {
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
} from "@100mslive/react-sdk";

let isEvenListenersAttached = false;

export function KeyboardInputManager(hmsReactiveStore) {
  let isShortcutExecuted = false;
  const hmsActions = hmsReactiveStore.getActions();
  const hmsVanillaStore = hmsReactiveStore.getStore();

  const toggleAudio = async () => {
    if (!isShortcutExecuted) {
      const enabled = hmsVanillaStore.getState(selectIsLocalAudioEnabled);
      await hmsActions.setLocalAudioEnabled(!enabled);
      isShortcutExecuted = true;
    }
  };

  const toggleVideo = async () => {
    if (!isShortcutExecuted) {
      const enabled = hmsVanillaStore.getState(selectIsLocalVideoEnabled);
      await hmsActions.setLocalVideoEnabled(!enabled);
      isShortcutExecuted = true;
    }
  };

  const keyDownHandler = async e => {
    const CONTROL_KEY = e.ctrlKey;
    const SHIFT_KEY = e.shiftKey;
    const M_KEY = e.key === "m" || e.key === "M";
    const K_KEY = e.key === "k" || e.key === "K";

    const SHORTCUT_TOGGLE_AUDIO = CONTROL_KEY && M_KEY;
    const SHORTCUT_TOGGLE_VIDEO = CONTROL_KEY && SHIFT_KEY && K_KEY;

    if (SHORTCUT_TOGGLE_AUDIO) {
      await toggleAudio();
    }

    if (SHORTCUT_TOGGLE_VIDEO) {
      await toggleVideo();
    }
  };

  const keyUpHandler = e => {
    isShortcutExecuted = false;
  };

  const bind = () => {
    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);
  };

  const unbind = () => {
    document.removeEventListener("keydown", keyDownHandler, false);
    document.removeEventListener("keyup", keyUpHandler, false);
  };

  return {
    bindAllShortcuts: () => {
      if (!isEvenListenersAttached) {
        bind();
        isEvenListenersAttached = true;
      }
    },
    unbindAllShortcuts: () => {
      if (isEvenListenersAttached) {
        unbind();
        isEvenListenersAttached = false;
      }
    },
  };
}
