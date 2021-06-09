export function normalizeMediaId(id: string) {
  return id.replace(/[{}]/g, '');
}
