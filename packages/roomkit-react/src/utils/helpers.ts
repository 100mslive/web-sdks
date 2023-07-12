// For bottom action sheet, returns updated height based on drag
export const getUpdatedHeight = (e: React.TouchEvent<HTMLDivElement>) => {
  const heightToPercentage = 100 - ((e?.touches?.[0] || e).pageY / window.innerHeight) * 100;
  // Snap to top if height > 80%, should be at least 40vh
  const sheetHeightInVH = Math.max(40, heightToPercentage > 80 ? 100 : heightToPercentage);
  return `${sheetHeightInVH}vh`;
};
