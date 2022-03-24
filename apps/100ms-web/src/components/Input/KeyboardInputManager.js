import { selectIsLocalAudioEnabled } from "@100mslive/react-sdk";

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

  const keyDownHandler = async e => {
    if (e.ctrlKey && (e.key === "m" || e.key === "M")) {
      await toggleAudio();
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
    document.addEventListener("keyup", keyUpHandler, false);
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
