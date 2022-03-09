export const getText = num => {
  if (num > 2) {
    return "Good Connection";
  } else if (num === 2) {
    return "Moderate Connection";
  } else {
    return "Poor Connection";
  }
};

export const getColor = (index, value, defaultColor) => {
  if (value > 3) {
    return "#37F28D";
  } else if (value === 3) {
    return index < 3 ? "#37F28D" : defaultColor;
  } else if (value === 2) {
    return index < 2 ? "#FAC919" : defaultColor;
  } else {
    return index === 0 ? "#ED4C5A" : defaultColor;
  }
};
