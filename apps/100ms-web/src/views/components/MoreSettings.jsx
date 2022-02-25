import React, {
  useState,
  useContext,
  Fragment,
  useMemo,
  useEffect,
} from "react";
import {
  Button,
  ContextMenu,
  ContextMenuItem,
  UiSettings,
} from "@100mslive/hms-video-react";
import {
  selectPermissions,
  useHMSActions,
  useHMSStore,
  selectAvailableRoleNames,
  selectLocalPeer,
} from "@100mslive/react-sdk";
import {
  InfoIcon,
  MenuIcon,
  PersonIcon,
  CheckIcon,
  SettingIcon,
  SpotlightIcon,
  GridIcon,
  ArrowRightIcon,
  ComputerIcon,
  RecordIcon,
  TextboxIcon,
} from "@100mslive/react-icons";
import { AppContext } from "../../store/AppContext";
import { hmsToast } from "./notifications/hms-toast";
import { arrayIntersection, setFullScreenEnabled } from "../../common/utils";
import screenfull from "screenfull";
import { RecordingAndRTMPModal } from "./RecordingAndRTMPModal";
import { MuteAll } from "./MuteAll";
import { ChangeName } from "./ChangeName";
import { FeatureFlags } from "../../store/FeatureFlags";
import { StatsForNerds } from "./StatsForNerds";
import Settings from "../new/Settings";

export const MoreSettings = () => {
  const {
    setMaxTileCount,
    maxTileCount,
    subscribedNotifications,
    setSubscribedNotifications,
    uiViewMode,
    setuiViewMode,
    appPolicyConfig: { selfRoleChangeTo },
    HLS_VIEWER_ROLE,
  } = useContext(AppContext);
  const roles = useHMSStore(selectAvailableRoleNames);
  const localPeer = useHMSStore(selectLocalPeer);
  const permissions = useHMSStore(selectPermissions);
  const hmsActions = useHMSActions();
  const [showMenu, setShowMenu] = useState(false);
  const [showMuteAll, setShowMuteAll] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUiSettings, setShowUiSettings] = useState(false);
  const [showRecordingAndRTMPModal, setShowRecordingAndRTMPModal] =
    useState(false);
  const [showStatsForNerds, setShowStatsForNerds] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const [isFullScreenEnabled, setIsFullScreenEnabled] = useState(
    screenfull.isFullscreen
  );
  const [showChangeNameModal, setShowChangeNameModal] = useState(false);

  const availableSelfChangeRoles = useMemo(
    () => arrayIntersection(selfRoleChangeTo, roles),
    [roles, selfRoleChangeTo]
  );

  useEffect(() => {
    if (screenfull.isEnabled) {
      screenfull.on("change", () => {
        setIsFullScreenEnabled(screenfull.isFullscreen);
      });
    }
  }, []);

  const onChange = count => {
    setMaxTileCount(count);
  };

  const onNotificationChange = notification => {
    setSubscribedNotifications(notification);
  };
  const onViewModeChange = layout => {
    setuiViewMode(layout);
  };

  const uiSettingsProps = {
    sliderProps: {
      onTileCountChange: onChange,
      maxTileCount,
    },
    notificationProps: {
      onNotificationChange,
      subscribedNotifications,
    },
    layoutProps: {
      onViewModeChange,
      uiViewMode,
    },
  };

  return (
    <Fragment>
      <ContextMenu
        menuOpen={showMenu}
        onTrigger={value => {
          setShowMenu(value);
        }}
        classes={{
          root: "static",
          trigger: "bg-transparent-0",
          menu: "mt-0 py-0 w-52",
        }}
        trigger={
          <Button
            iconOnly
            variant="no-fill"
            iconSize="md"
            shape="rectangle"
            active={showMenu}
            key="hamburgerIcon"
          >
            <MenuIcon />
          </Button>
        }
        menuProps={{
          anchorOrigin: {
            vertical: "top",
            horizontal: "center",
          },
          transformOrigin: {
            vertical: "bottom",
            horizontal: "center",
          },
        }}
      >
        <ContextMenuItem
          icon={<TextboxIcon />}
          label="Change my name"
          key="change-name"
          onClick={() => setShowChangeNameModal(true)}
        />
        {permissions.changeRole && (
          <ContextMenuItem
            icon={<PersonIcon />}
            label="Change my role"
            key="changeRole"
            classes={{
              menuTitleContainer: "relative",
              menuItemChildren: "hidden",
            }}
            closeMenuOnClick={false}
            iconRight={<ArrowRightIcon />}
            onClick={event => {
              setAnchorEl(anchorEl ? null : event.currentTarget);
            }}
            active={!!anchorEl}
          >
            {anchorEl && (
              <ContextMenu
                classes={{ trigger: "bg-transparent-0", menu: "w-44" }}
                menuOpen
                menuProps={{
                  anchorEl: anchorEl,
                  anchorOrigin: {
                    vertical: "top",
                    horizontal: "right",
                  },
                  transformOrigin: {
                    vertical: "center",
                    horizontal: -12,
                  },
                }}
                trigger={<div className="absolute w-full h-0"></div>}
              >
                {availableSelfChangeRoles.map(role => {
                  return (
                    <ContextMenuItem
                      label={role}
                      key={role}
                      onClick={async () => {
                        try {
                          await hmsActions.changeRole(localPeer.id, role, true);
                          setShowMenu(false);
                        } catch (error) {
                          hmsToast(error.message);
                        }
                      }}
                      iconRight={
                        localPeer && localPeer.roleName === role ? (
                          <CheckIcon width={16} height={16} />
                        ) : null
                      }
                    />
                  );
                })}
              </ContextMenu>
            )}
          </ContextMenuItem>
        )}
        {(permissions.streaming || permissions.recording) && (
          <ContextMenuItem
            icon={<RecordIcon />}
            label="Streaming/Recording"
            key="streaming-recording"
            onClick={() => {
              setShowRecordingAndRTMPModal(true);
            }}
          />
        )}
        {screenfull.isEnabled && (
          <ContextMenuItem
            icon={<ComputerIcon />}
            label={`${isFullScreenEnabled ? "Exit " : ""}Full Screen`}
            key="toggleFullScreen"
            onClick={() => {
              setFullScreenEnabled(!isFullScreenEnabled);
            }}
          />
        )}
        {permissions.mute && (
          <ContextMenuItem
            label="Mute All"
            icon={<SpotlightIcon />}
            onClick={() => {
              setShowMuteAll(true);
            }}
          />
        )}
        {localPeer.roleName !== HLS_VIEWER_ROLE && (
          <ContextMenuItem
            icon={<GridIcon />}
            label="UI Settings"
            key="changeLayout"
            addDivider={true}
            onClick={() => {
              setShowUiSettings(true);
            }}
          />
        )}
        <ContextMenuItem
          icon={<SettingIcon />}
          label="Device Settings"
          key="settings"
          onClick={() => {
            setShowSettings(true);
          }}
        />
        {FeatureFlags.enableStatsForNerds && (
          <ContextMenuItem
            icon={<InfoIcon height={17} />}
            label="Stats for Nerds"
            key="stats"
            onClick={() => {
              setShowStatsForNerds(true);
            }}
          />
        )}
      </ContextMenu>
      <Settings
        open={showSettings}
        onOpenChange={state => setShowSettings(state)}
      />
      <UiSettings
        {...uiSettingsProps}
        showModal={showUiSettings}
        onModalClose={() => setShowUiSettings(false)}
      />
      <MuteAll
        showModal={showMuteAll}
        onCloseModal={() => setShowMuteAll(false)}
      />
      <RecordingAndRTMPModal
        showRecordingAndRTMPModal={showRecordingAndRTMPModal}
        setShowRecordingAndRTMPModal={setShowRecordingAndRTMPModal}
        permissions={permissions}
      />
      <ChangeName
        setShowChangeNameModal={setShowChangeNameModal}
        showChangeNameModal={showChangeNameModal}
      />
      {FeatureFlags.enableStatsForNerds && (
        <StatsForNerds
          open={showStatsForNerds}
          onOpenChange={setShowStatsForNerds}
        />
      )}
    </Fragment>
  );
};
