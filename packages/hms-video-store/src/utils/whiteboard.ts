import { WHITEBOARD_ORIGIN, WHITEBOARD_QA_ORIGIN } from './constants';
import { ENV } from './support';

export const constructWhiteboardURL = (token: string, addr: string, env?: ENV) => {
  const origin = env === ENV.QA ? WHITEBOARD_QA_ORIGIN : WHITEBOARD_ORIGIN;

  const url = new URL(origin);
  url.searchParams.set('endpoint', `https://${addr}`);
  url.searchParams.set('token', token);

  return url.toString();
};
