/**
 * @param retryCodes codes from the server reponse that needs to be retried
 */
export const fetchWithRetry = async (
  url: RequestInfo,
  options: RequestInit,
  retryCodes?: number[],
): Promise<Response> => {
  const MAX_RETRIES = 4;
  let error = Error('something went wrong during fetch');
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      // fetch will throw error if there's a browser-level issue
      const response = await fetch(url, options);
      const data = await response.json();
      // throw error for additional codes to retry based on server's response
      if (retryCodes && !response.ok && retryCodes.includes(data.code)) {
        throw Error(data.message);
      }

      return response;
    } catch (err) {
      error = err as unknown as Error;
    }
  }
  throw error;
};
