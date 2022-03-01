export const getLeft = (index: number, currentPageIndex: number) => {
  //active slide
  if (index === currentPageIndex) {
    return 0;
  }
  //prev slide
  if (index + 1 === currentPageIndex) {
    return '-100%';
  }
  //next slide
  if (index - 1 === currentPageIndex) {
    return '100%';
  }
  //all slides before prev
  if (index < currentPageIndex) {
    return '-200%';
  }
  //all slides after next
  return '200%';
};
