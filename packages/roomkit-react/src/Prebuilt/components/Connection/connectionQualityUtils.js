const connectionTooltip = {
  0: 'Reconnecting',
  1: 'Very Bad Connection',
  2: 'Bad Connection',
  3: 'Moderate Connection',
  4: 'Good Connection',
  5: 'Excellent Connection',
};
connectionTooltip[-1] = 'Network Unknown';

/**
 * @param connectionScore -> 1-5 connection score for network quality
 */
export const getTooltipText = connectionScore => {
  return connectionTooltip[connectionScore];
};

/**
 * position is needed here as we don't want all the dots/arcs to be colored,
 * the non colored ones will be passed in the default color. If user is
 * disconnected(score=0), no dot/arc will be colored.
 * @param position -> 1 to 5
 * @param connectionScore -> 0 to 5, 0 means disconnected
 * @param defaultColor -> color for components not taking the connection color
 */
export const getColor = (position, connectionScore, defaultColor, theme) => {
  const shouldBeColored = position <= connectionScore;
  if (!shouldBeColored) {
    return defaultColor;
  }
  if (connectionScore >= 4) {
    return theme.colors.alert_success;
  } else if (connectionScore >= 1) {
    return theme.colors.alert_warning;
  }
  return defaultColor;
};
