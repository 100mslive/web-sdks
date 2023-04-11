import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { usePrevious } from "react-use";
import {
  HMSRoomState,
  selectAppData,
  selectIsConnectedToRoom,
  selectRoomState,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Box, Flex } from "@100mslive/react-ui";
import { ConferenceMainView } from "../layouts/mainView";
import { Footer } from "./Footer";
import FullPageProgress from "./FullPageProgress";
import { Header } from "./Header";
import { RoleChangeRequestModal } from "./RoleChangeRequestModal";
import { useIsHeadless } from "./AppData/useUISettings";
import { useNavigation } from "./hooks/useNavigation";
import { APP_DATA } from "../common/constants";

let timeout = null;

const Conference = () => {
  const navigate = useNavigation();
  const { roomId, role } = useParams();
  const isHeadless = useIsHeadless();
  const roomState = useHMSStore(selectRoomState);
  const prevState = usePrevious(roomState);
  const isConnectedToRoom = useHMSStore(selectIsConnectedToRoom);
  const hmsActions = useHMSActions();
  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const [hideControls, setHideControls] = useState(false);
  const autoHideControlsAfter = useHMSStore(
    selectAppData(APP_DATA.autoHideControlsAfter)
  );
  const autoHideControlsAfterRef = useRef();
  autoHideControlsAfterRef.current = autoHideControlsAfter;

  const resetTimer = () => {
    clearTimeout(timeout);
    if (autoHideControlsAfterRef.current !== null) {
      timeout = setTimeout(() => {
        setHideControls(true);
      }, autoHideControlsAfterRef.current || 5000);
    }
  };
  const onPageClick = () => {
    setHideControls(false);
    resetTimer();
  };

  useEffect(() => {
    resetTimer();
  }, [autoHideControlsAfter]);
  useEffect(() => {
    document.addEventListener("click", onPageClick);
    return () => {
      document.removeEventListener("click", onPageClick);
    };
  }, []);

  useEffect(() => {
    if (!roomId) {
      navigate(`/`);
      return;
    }
    if (
      !prevState &&
      !(
        roomState === HMSRoomState.Connecting ||
        roomState === HMSRoomState.Reconnecting ||
        isConnectedToRoom
      )
    ) {
      if (role) navigate(`/preview/${roomId || ""}/${role}`);
      else navigate(`/preview/${roomId || ""}`);
    }
  }, [isConnectedToRoom, prevState, roomState, navigate, role, roomId]);

  useEffect(() => {
    // beam doesn't need to store messages, saves on unnecessary store updates in large calls
    if (isHeadless) {
      hmsActions.ignoreMessageTypes(["chat"]);
    }
  }, [isHeadless, hmsActions]);

  if (!isConnectedToRoom) {
    return <FullPageProgress />;
  }

  return (
    <Flex css={{ size: "100%" }} direction="column">
      {!isHeadless && (
        <Box
          css={{
            h: "$18",
            transition: "margin 0.5s ease-in-out",
            "@md": { h: "$17" },
            "@sm": {
              ...(hideControls && {
                marginTop: `-${headerRef?.current?.clientHeight}px`,
              }),
            },
          }}
          ref={headerRef}
          data-testid="header"
        >
          <Header />
        </Box>
      )}
      <Box
        css={{
          w: "100%",
          flex: "1 1 0",
          minHeight: 0,
        }}
        data-testid="conferencing"
      >
        <ConferenceMainView />
      </Box>
      {!isHeadless && (
        <Box
          css={{
            flex: "0 0 15%",
            maxHeight: "$24",
            transition: "margin 0.5s ease-in-out",
            "@md": {
              maxHeight: "none",
            },
            "@sm": {
              maxHeight: "none",
              ...(hideControls && {
                marginBottom: `-${footerRef?.current?.clientHeight}px`,
              }),
            },
          }}
          ref={footerRef}
          data-testid="footer"
        >
          <Footer />
        </Box>
      )}
      <RoleChangeRequestModal />
    </Flex>
  );
};

export default Conference;
