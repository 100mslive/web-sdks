import React from "react";
import { Tldraw } from "@tldraw/tldraw";
import usePusherEvents from "./pusher/useMultiplayerState";
import useYjsEvents from "./yjs/useMultiplayerState";
import "./Whiteboard.css";

const useMultiplayerState =
  process.env.REACT_APP_WHITEBOARD_PROVIDER === "pusher"
    ? usePusherEvents
    : useYjsEvents;

export const Whiteboard = React.memo(({ roomId }) => {
  const events = useMultiplayerState(roomId);

  return (
    <Tldraw
      autofocus
      disableAssets={true}
      showSponsorLink={false}
      showPages={false}
      showMenu={false}
      {...events}
    />
  );
});
