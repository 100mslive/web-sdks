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
import { Box, Button, Flex } from "@100mslive/react-ui";
import { ConferenceMainView } from "../layouts/mainView";
import { Footer } from "./Footer";
import FullPageProgress from "./FullPageProgress";
import { Header } from "./Header";
import { RoleChangeRequestModal } from "./RoleChangeRequestModal";
import { useIsHeadless } from "./AppData/useUISettings";
import { useNavigation } from "./hooks/useNavigation";
import {
  APP_DATA,
  EMOJI_REACTION_TYPE,
  isAndroid,
  isIOS,
  isIPadOS,
} from "../common/constants";
import { ToastManager } from "./Toast/ToastManager";
import { useSidepaneToggle } from "./AppData/useSidepane";
import { SIDE_PANE_OPTIONS } from "../common/constants";

const Conference = () => {
  const navigate = useNavigation();
  const { roomId, role } = useParams();
  const isHeadless = useIsHeadless();
  const roomState = useHMSStore(selectRoomState);
  const prevState = usePrevious(roomState);
  const isConnectedToRoom = useHMSStore(selectIsConnectedToRoom);
  const hmsActions = useHMSActions();
  const [hideControls, setHideControls] = useState(false);
  const dropdownList = useHMSStore(selectAppData(APP_DATA.dropdownList));
  const headerRef = useRef();
  const footerRef = useRef();
  const dropdownListRef = useRef();
  const performAutoHide = hideControls && (isAndroid || isIOS || isIPadOS);
  const toggleVoting = useSidepaneToggle(SIDE_PANE_OPTIONS.VOTING);

  const toggleControls = e => {
    if (dropdownListRef.current?.length === 0) {
      setHideControls(value => !value);
    }
  };

  useEffect(() => {
    let timeout = null;
    dropdownListRef.current = dropdownList || [];
    if (dropdownListRef.current.length === 0) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (dropdownListRef.current.length === 0) {
          setHideControls(true);
        }
      }, 5000);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [dropdownList, hideControls]);

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
      hmsActions.ignoreMessageTypes(["chat", EMOJI_REACTION_TYPE]);
    }
  }, [isHeadless, hmsActions]);

  useEffect(() => {
    ToastManager.addToast({
      title: "Tyler has started a poll",
      action: (
        <Button
          onClick={toggleVoting}
          variant="standard"
          css={{
            backgroundColor: "$surfaceLight",
            fontWeight: "$semiBold",
            color: "$textHighEmp",
            p: "$xs $md",
          }}
        >
          Vote
        </Button>
      ),
    });
  }, []);

  if (!isConnectedToRoom) {
    return <FullPageProgress />;
  }

  return (
    <Flex css={{ size: "100%", overflow: "hidden" }} direction="column">
      {!isHeadless && (
        <Box
          ref={headerRef}
          css={{
            h: "$18",
            transition: "margin 0.3s ease-in-out",
            marginTop: performAutoHide
              ? `-${headerRef.current?.clientHeight}px`
              : "none",
            "@md": {
              h: "$17",
            },
          }}
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
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        id="conferencing"
        data-testid="conferencing"
        onClick={toggleControls}
      >
        <ConferenceMainView />
      </Box>
      {!isHeadless && (
        <Box
          ref={footerRef}
          css={{
            flexShrink: 0,
            maxHeight: "$24",
            transition: "margin 0.3s ease-in-out",
            marginBottom: performAutoHide
              ? `-${footerRef.current?.clientHeight}px`
              : undefined,
            "@md": {
              maxHeight: "unset",
            },
          }}
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
