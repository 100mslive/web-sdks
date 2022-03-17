export const convertDateNumToDate = (dateNum?: number): Date | undefined => {
  return dateNum ? new Date(dateNum) : undefined;
};
