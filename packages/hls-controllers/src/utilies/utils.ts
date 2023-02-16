/**
 *
 * @param payload a base64 string coming from backend
 * @returns a parsed data which contains payload, start_date, end_date, version
 */
export const metadataPayloadParser = (payload: string) => {
  try {
    const data = window.atob(payload);
    const parsedData = JSON.parse(data);
    return parsedData;
  } catch (e) {
    return { payload };
  }
};
