import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { usePrevious } from "react-use";
import {
  HMSRoomState,
  parsedUserAgent,
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
import { APP_DATA, isAndroid, isIOS, isIPadOS } from "../common/constants";

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
  const dropdownListRef = useRef();
  dropdownListRef.current = dropdownList;
  const performAutoHide = hideControls && (isAndroid || isIOS || isIPadOS);

  useEffect(() => {
    let timeout = null;
    if (dropdownList.length > 0) {
      setHideControls(false);
    } else {
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
    const onPageClick = () => {
      setHideControls(false);
    };
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
    <Flex css={{ size: "100%", overflow: "hidden" }} direction="column">
      {!isHeadless && (
        <Box
          css={{
            h: "$18",
            transition: "transform 0.3s ease-in-out",
            transform: performAutoHide ? "translateY(-100%)" : "none",
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
          flex: performAutoHide ? "0 0 100%" : "1 1 0",
          minHeight: 0,
        }}
        data-testid="conferencing"
      >
        <ConferenceMainView />
      </Box>
      {!isHeadless && (
        <Box
          css={{
            flexShrink: 0,
            maxHeight: "$24",
            transition: "transform 0.3s ease-in-out",
            transform: performAutoHide ? "translateY(100%)" : "none",
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
