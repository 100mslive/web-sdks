export const getText = connectionScore => {
  if (connectionScore > 2) {
    return "Good Connection";
  } else if (connectionScore === 2) {
    return "Moderate Connection";
  } else if (connectionScore === 0) {
    return "Reconnecting";
  } else {
    return "Poor Connection";
  }
};

export const getColor = (position, connectionScore, defaultColor) => {
  if (connectionScore > 3) {
    return "#37F28D";
  } else if (connectionScore === 3) {
    return position < 3 ? "#37F28D" : defaultColor;
  } else if (connectionScore === 2) {
    return position < 2 ? "#FAC919" : defaultColor;
  } else {
    return position === 0 ? "#ED4C5A" : defaultColor;
  }
};
