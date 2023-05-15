import React from "react";
import { useParams } from "react-router-dom";
import { useSearchParam } from "react-use";
import { Box, Flex, Loading } from "@100mslive/react-ui";
import SidePane from "../../layouts/SidePane";
import { Header } from "../Header";
import PreviewJoin from "./PreviewJoin";
import { useAuthToken, useSetUiSettings } from "../AppData/useUISettings";
import { useNavigation } from "../hooks/useNavigation";
import {
  QUERY_PARAM_NAME,
  QUERY_PARAM_PREVIEW_AS_ROLE,
  QUERY_PARAM_SKIP_PREVIEW,
  QUERY_PARAM_SKIP_PREVIEW_HEADFUL,
  UI_SETTINGS,
} from "../../common/constants";

const PreviewContainer = () => {
  const navigate = useNavigation();
  // way to skip preview for automated tests, beam recording and streaming
  const beamInToken = useSearchParam("token") === "beam_recording"; // old format to remove
  // use this field to join directly for quick testing while in local
  const directJoinHeadfulFromEnv =
    process.env.REACT_APP_HEADLESS_JOIN === "true";
  const directJoinHeadful =
    useSearchParam(QUERY_PARAM_SKIP_PREVIEW_HEADFUL) === "true" ||
    directJoinHeadfulFromEnv;
  let skipPreview = useSearchParam(QUERY_PARAM_SKIP_PREVIEW) === "true";
  skipPreview = skipPreview || beamInToken || directJoinHeadful;
  const previewAsRole = useSearchParam(QUERY_PARAM_PREVIEW_AS_ROLE);
  const initialName =
    useSearchParam(QUERY_PARAM_NAME) || (skipPreview ? "Beam" : "");
  const { roomId: urlRoomId, role: userRole } = useParams(); // from the url
  const [, setIsHeadless] = useSetUiSettings(UI_SETTINGS.isHeadless);
  const authToken = useAuthToken();

  const onJoin = () => {
    !directJoinHeadful && setIsHeadless(skipPreview);
    let meetingURL = `/meeting/${urlRoomId}`;
    if (userRole) {
      meetingURL += `/${userRole}`;
    }
    navigate(meetingURL);
  };
  return (
    <Flex direction="column" css={{ size: "100%" }}>
      <Box
        css={{ h: "$18", "@md": { h: "$17", flexShrink: 0 } }}
        data-testid="header"
      >
        <Header />
      </Box>
      <Flex
        css={{ flex: "1 1 0", position: "relative", overflowY: "auto" }}
        justify="center"
        align="center"
      >
        {authToken ? (
          <PreviewJoin
            initialName={initialName}
            skipPreview={skipPreview}
            asRole={previewAsRole}
            onJoin={onJoin}
          />
        ) : (
          <Loading size={100} />
        )}
        <SidePane
          css={{
            position: "unset",
            mr: "$10",
            "@lg": { position: "fixed", mr: "$0" },
          }}
        />
      </Flex>
    </Flex>
  );
};

export default PreviewContainer;
