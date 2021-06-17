export function normalizeMediaId(id: string) {
  return id;
  // @NOTE: This is no longer needed. We'll need to clean up the code wherever this is used
  // return id.replace(/[{}]/g, '');
}
