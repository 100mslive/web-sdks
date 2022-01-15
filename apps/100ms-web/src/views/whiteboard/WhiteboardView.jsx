import React from "react";
import {
  selectPeers,
  selectRoom,
  useHMSStore,
} from "@100mslive/hms-video-react";
import { Tldraw } from "@tldraw/tldraw";
import { SidePane } from "../screenShareView";
import { useMultiplayerState } from "./useMultiplayerState";

function Editor({ roomId }) {
  const { error, ...events } = useMultiplayerState(roomId);

  return (
    <div className="w-full h-full relative">
      <Tldraw
        autofocus
        disableAssets={true}
        showSponsorLink={false}
        showPages={false}
        showMenu={false}
        {...events}
      />
    </div>
  );
}

export const WhiteboardView = ({
  isChatOpen,
  toggleChat,
  isParticipantListOpen,
  videoTileProps,
}) => {
  const peers = useHMSStore(selectPeers);
  const room = useHMSStore(selectRoom);
  return (
    <React.Fragment>
      <div className="w-full h-full flex flex-col md:flex-row">
        <div className="mr-2 ml-2 md:ml-3 md:w-8/10 h-2/3 md:h-full">
          <div className="object-contain h-full">
            <Editor roomId={room.id} />
          </div>
        </div>
        <div className="flex flex-wrap overflow-hidden p-2 w-full h-1/3 md:w-2/10 md:h-full ">
          <SidePane
            isChatOpen={isChatOpen}
            toggleChat={toggleChat}
            isPresenterInSmallTiles={true}
            smallTilePeers={peers}
            isParticipantListOpen={isParticipantListOpen}
            totalPeers={peers.length}
            videoTileProps={videoTileProps}
          />
        </div>
      </div>
    </React.Fragment>
  );
};
