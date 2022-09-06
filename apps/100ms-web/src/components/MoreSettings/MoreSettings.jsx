import React, { Fragment, useState } from "react";
import {
  VerticalMenuIcon,
  InfoIcon,
  MicOffIcon,
  SettingsIcon,
  PencilIcon,
  RemoveUserIcon,
  ClipIcon,
} from "@100mslive/react-icons";
import {
  selectLocalPeerID,
  selectPermissions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Box, Dropdown, Text, Tooltip } from "@100mslive/react-ui";
import { ChangeSelfRole } from "./ChangeSelfRole";
import { FullScreenItem } from "./FullScreenItem";
import SettingsModal from "../Settings/SettingsModal";
import { RoleChangeModal } from "../RoleChangeModal";
import { ChangeNameModal } from "./ChangeNameModal";
import { StatsForNerds } from "../StatsForNerds";
import { MuteAllModal } from "./MuteAllModal";
import { FeatureFlags } from "../../services/FeatureFlags";
import IconButton from "../../IconButton";
import { ChatBlacklistModal } from "./ChatBlacklist";
import { useBlacklistPeers } from "../hooks/useBlacklistPeers";
import { usePinnedText } from "../hooks/usePinnedText";
import { ChangePinnedTextModal } from "./ChangePinnedModal";

export const MoreSettings = () => {
  const permissions = useHMSStore(selectPermissions);
  const localPeerId = useHMSStore(selectLocalPeerID);
  const { blacklistedPeers, blacklistPeer } = useBlacklistPeers();
  const { pinnedText, changePinnedText } = usePinnedText();
  const [open, setOpen] = useState(false);
  const [showChangeNameModal, setShowChangeNameModal] = useState(false);
  const [showMuteAll, setShowMuteAll] = useState(false);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [showStatsForNerds, setShowStatsForNerds] = useState(false);
  const [showSelfRoleChange, setShowSelfRoleChange] = useState(false);
  const [showChatBlacklist, setShowChatBlacklist] = useState(false);
  const [showChangePinnedModal, setShowChangePinnedModal] = useState(false);

  return (
    <Fragment>
      <Dropdown.Root open={open} onOpenChange={setOpen}>
        <Dropdown.Trigger asChild data-testid="more_settings_btn">
          <IconButton>
            <Tooltip title="More options">
              <Box>
                <VerticalMenuIcon />
              </Box>
            </Tooltip>
          </IconButton>
        </Dropdown.Trigger>

        <Dropdown.Content
          sideOffset={5}
          align="center"
          css={{ maxHeight: "$96", "@md": { w: "$64" } }}
        >
          <Dropdown.Item
            onClick={() => setShowChangeNameModal(value => !value)}
            data-testid="change_name_btn"
          >
            <PencilIcon />
            <Text variant="sm" css={{ ml: "$4" }}>
              Change Name
            </Text>
          </Dropdown.Item>
          <ChangeSelfRole onClick={() => setShowSelfRoleChange(true)} />
          <FullScreenItem />
          {permissions.mute && (
            <Dropdown.Item
              onClick={() => setShowMuteAll(true)}
              data-testid="mute_all_btn"
            >
              <MicOffIcon />
              <Text variant="sm" css={{ ml: "$4" }}>
                Mute All
              </Text>
            </Dropdown.Item>
          )}
          <Dropdown.Item
            onClick={() => setShowChatBlacklist(true)}
            data-testid="chat_blacklist_btn"
          >
            <RemoveUserIcon />
            <Text variant="sm" css={{ ml: "$4" }}>
              Chat Blacklist
            </Text>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => setShowChangePinnedModal(true)}
            data-testid="change_pinned_btn"
          >
            <ClipIcon />
            <Text variant="sm" css={{ ml: "$4" }}>
              Change Pinned Text
            </Text>
          </Dropdown.Item>
          <Dropdown.ItemSeparator />
          <Dropdown.Item
            onClick={() => setShowDeviceSettings(true)}
            data-testid="device_settings_btn"
          >
            <SettingsIcon />
            <Text variant="sm" css={{ ml: "$4" }}>
              Settings
            </Text>
          </Dropdown.Item>
          {FeatureFlags.enableStatsForNerds && (
            <Dropdown.Item
              onClick={() => setShowStatsForNerds(true)}
              data-testid="stats_for_nreds_btn"
            >
              <InfoIcon />
              <Text variant="sm" css={{ ml: "$4" }}>
                Stats for Nerds
              </Text>
            </Dropdown.Item>
          )}
        </Dropdown.Content>
      </Dropdown.Root>
      {showMuteAll && <MuteAllModal onOpenChange={setShowMuteAll} />}
      {showChangeNameModal && (
        <ChangeNameModal onOpenChange={setShowChangeNameModal} />
      )}
      {showDeviceSettings && (
        <SettingsModal open onOpenChange={setShowDeviceSettings} />
      )}
      {FeatureFlags.enableStatsForNerds && showStatsForNerds && (
        <StatsForNerds
          open={showStatsForNerds}
          onOpenChange={setShowStatsForNerds}
        />
      )}
      {showSelfRoleChange && (
        <RoleChangeModal
          peerId={localPeerId}
          onOpenChange={setShowSelfRoleChange}
        />
      )}
      {showChatBlacklist && (
        <ChatBlacklistModal
          onOpenChange={setShowChatBlacklist}
          blacklistPeer={blacklistPeer}
          blacklistedPeers={blacklistedPeers}
        />
      )}
      {showChangePinnedModal && (
        <ChangePinnedTextModal
          onOpenChange={setShowChangePinnedModal}
          pinnedText={pinnedText}
          changePinnedText={changePinnedText}
        />
      )}
    </Fragment>
  );
};
