import LogRocket from "logrocket";
import { FeatureFlags } from "./FeatureFlags";

export const convertLoginInfoToJoinConfig = loginInfo => {
  const joinConfig = {
    userName: loginInfo.username,
    authToken: loginInfo.token,
    metaData: "",
    initEndpoint: loginInfo.env
      ? `https://${loginInfo.env.split("-")[0]}-init.100ms.live/init`
      : "https://prod-init.100ms.live/init",
    settings: {
      isAudioMuted: loginInfo.audioMuted,
      isVideoMuted: loginInfo.videoMuted,
      audioInputDeviceId: loginInfo.selectedAudioInput,
      audioOutputDeviceId: loginInfo.selectedAudioOutput,
      videoDeviceId: loginInfo.selectedVideoInput,
    },
    rememberDeviceSelection: true,
    alwaysRequestPermissions: FeatureFlags.alwaysRequestPermissions(),
  };
  console.debug("app: Config is", joinConfig);
  return joinConfig;
};

const logRocketKey = process.env.REACT_APP_LOGROCKET_ID;
let logRocketSessionUrl;
export const setUpLogRocket = ({ localPeer, roomId, sessionId }) => {
  LogRocket.identify(localPeer.id, {
    name: localPeer.name,
    email: roomId,
    role: localPeer.roleName,
    roomId,
    sessionId,
  });
  LogRocket.getSessionURL(url => {
    window.logrocketURL = url;
    logRocketSessionUrl = url;
  });
};

// LogRocket recording fix which breaks due to use of insertRule, as css inserted by insertrule is not
// captured by LogRocket which only relies on Mutation Observers for DOM.
// https://github.com/modulz/stitches/issues/873
// https://gist.github.com/oeduardoal/499923b72422e4222c5073ba2a708ad1
const LogRocketRecording = {
  conditions: () => logRocketKey && logRocketSessionUrl,
  run: () => {
    if (typeof window === "undefined") return;
    const syncStylesNode = document.createElement("style");
    // identify our style node tag so we can ignore it to avoid recursive loop later
    syncStylesNode.dataset.lrWorkaround = "true";
    document.head.insertBefore(syncStylesNode, document.head.children[0]);

    // start styles sync
    const updateStyles = () => {
      const styleNodes = Array.from(document.querySelectorAll("head style"));

      if (!styleNodes.length) return; // no stylesheet
      const start = performance.now();
      syncStylesNode.textContent = styleNodes
        .reduce((aggregation, newNode) => {
          // ignore the target style node
          if (newNode.dataset.lrWorkaround) return aggregation;

          if (!newNode.sheet) return aggregation;
          const stitchesPrefix = "hms-ui"; // given while using createStitches
          const rulesString = Array.from(newNode.sheet.cssRules)
            .reduce((previousRuleValue, rule) => {
              if (!rule.cssText.includes(stitchesPrefix))
                return previousRuleValue;
              return previousRuleValue.concat(rule.cssText);
            }, [])
            .join(" ");

          return aggregation.concat(rulesString);
        }, [])
        .join(" ");
      console.debug(
        `syncing stylesheets took ${(performance.now() - start).toFixed(2)}ms`
      );
    };

    let syncStylesTimeout;
    const debouncedSyncLogRocketStyles = () => {
      syncStylesTimeout && clearTimeout(syncStylesTimeout);
      syncStylesTimeout = setTimeout(updateStyles, 1000);
    };

    // proxy insertRule to update styles in DOM manually which logrocket can capture.
    const originalInsertRule = CSSStyleSheet.prototype.insertRule;
    CSSStyleSheet.prototype.insertRule = function (style, index) {
      originalInsertRule.call(this, style, index);
      if (LogRocketRecording.conditions()) {
        debouncedSyncLogRocketStyles();
      }
    };
  },
};

LogRocketRecording.run();

// interface RoleConfig {
//   center?: HMSRoleName[];
//   sidepane?: HMSRoleName[];
//   selfRoleChangeTo?: HMSRoleName[];
//   remoteRoleChangeFor?: HMSRoleName[];
// }

// interface PolicyConfig {
//   [role: string]: RoleConfig;
// }

/**
 * check if a role is allowed to publish either of audio or video
 */
function canPublishAV(role) {
  const params = role?.publishParams;
  if (params?.allowed) {
    return params.allowed.includes("video") || params.allowed.includes("audio");
  }
  return false;
}

/**
 * Figure out the layout for each role. There is some extra work being done
 * here currently to figure out the layout for roles other than local peer too
 * which can be avoided.
 */
export const normalizeAppPolicyConfig = (
  roleNames,
  rolesMap,
  appPolicyConfig = {}
) => {
  const newConfig = Object.assign({}, appPolicyConfig);
  roleNames.forEach(roleName => {
    if (!newConfig[roleName]) {
      newConfig[roleName] = {};
    }
    if (!newConfig[roleName].center) {
      const publishingRoleNames = roleNames.filter(roleName =>
        canPublishAV(rolesMap[roleName])
      );
      // all other publishing roles apart from local role in center by default
      newConfig[roleName].center = publishingRoleNames.filter(
        rName => rName !== roleName
      );
    }
    // everyone from my role is in sidepane by default if they can publish
    if (!newConfig[roleName].sidepane) {
      newConfig[roleName].sidepane = canPublishAV(rolesMap[roleName])
        ? [roleName]
        : [];
    }
    if (!newConfig[roleName].selfRoleChangeTo) {
      newConfig[roleName].selfRoleChangeTo = roleNames;
    }
    if (!newConfig[roleName].remoteRoleChangeFor) {
      newConfig[roleName].remoteRoleChangeFor = roleNames;
    }
  });

  return newConfig;
};
