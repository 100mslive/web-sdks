import { HMSSessionFeedback, HMSSessionInfo } from './session-info';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { HMSException } from '../internal';
import HMSLogger from '../utils/logger';

export class FeedbackService {
  private static TAG = '[FeedBackService]';
  private static handleError(response: Response) {
    switch (response.status) {
      case 404:
        throw ErrorFactory.APIErrors.EndpointUnreachable(HMSAction.FEEDBACK, response.statusText);
      case 200:
        break;
      default:
        throw ErrorFactory.APIErrors.ServerErrors(response.status, HMSAction.FEEDBACK, response?.statusText);
    }
  }

  static async sendFeedback({
    token,
    eventEndpoint = 'https://event.100ms.live',
    info,
    feedback,
  }: {
    token: string;
    eventEndpoint?: string;
    info: HMSSessionInfo;
    feedback?: HMSSessionFeedback;
  }): Promise<void> {
    HMSLogger.d(
      this.TAG,
      `sendFeednbck: feedbackEndpoint=${eventEndpoint} token=${token} peerId=${info.peer.peer_id} session=${info.peer.session_id} `,
    );
    const url = new URL('v2/client/feedback', eventEndpoint);
    const body = {
      ...info,
      payload: feedback,
    };
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
        method: 'POST',
      });
      try {
        this.handleError(response);
        return;
      } catch (err) {
        const text = await response.text();
        HMSLogger.e(this.TAG, 'json error', (err as Error).message, text);
        throw err instanceof HMSException
          ? err
          : ErrorFactory.APIErrors.ServerErrors(response.status, HMSAction.FEEDBACK, (err as Error).message);
      }
    } catch (err) {
      const error = err as Error;
      if (['Failed to fetch', 'NetworkError', 'ECONNRESET'].some(message => error.message.includes(message))) {
        throw ErrorFactory.APIErrors.EndpointUnreachable(HMSAction.FEEDBACK, error.message);
      }
      throw error;
    }
  }
}
