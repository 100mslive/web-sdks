import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';

/**
 * @param retryCodes codes from the server reponse that needs to be retried
 */
// eslint-disable-next-line complexity
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
      const data = await response.clone().json();
      // throw error for additional codes to retry based on server's response
      if (retryCodes && retryCodes.length && !response.ok && retryCodes.includes(data.code)) {
        throw ErrorFactory.APIErrors.ServerErrors(data.code, HMSAction.GET_TOKEN, data.message, false);
      }

      return response;
    } catch (err) {
      error = err as unknown as Error;
    }
  }
  if (['Failed to fetch', 'NetworkError'].some(message => error.message.includes(message))) {
    throw ErrorFactory.APIErrors.EndpointUnreachable(HMSAction.GET_TOKEN, error.message);
  }
  throw error;
};
