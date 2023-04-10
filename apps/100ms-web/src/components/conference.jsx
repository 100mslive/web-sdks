import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { usePrevious } from "react-use";
import {
  HMSRoomState,
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

const Conference = () => {
  const navigate = useNavigation();
  const { roomId, role } = useParams();
  const isHeadless = useIsHeadless();
  const roomState = useHMSStore(selectRoomState);
  const prevState = usePrevious(roomState);
  const isConnectedToRoom = useHMSStore(selectIsConnectedToRoom);
  const hmsActions = useHMSActions();
  const [idleTimer, setIdleTimer] = useState(0);
  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const hideControls = idleTimer >= 5;

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

  const resetIdleTimer = () => {
    setIdleTimer(0);
  };
  useEffect(() => {
    const interval = setInterval(() => {
      setIdleTimer(prevCount => prevCount + 1);
    }, 1000);
    document.addEventListener("click", resetIdleTimer);
    return () => {
      clearInterval(interval);
      document.removeEventListener("click", resetIdleTimer);
    };
  }, []);

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
            transition: "margin 0.5s ease-in-out",
            "@sm": {
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
