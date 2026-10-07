import { fetchWithRetry } from './fetch';
import { HMSException } from '../error/HMSException';

const RETRY_CODES = [429, 500, 502, 503];

const htmlResponse = (status: number) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'Bad Gateway',
    clone() {
      return this;
    },
    json: () => Promise.reject(new SyntaxError("Unexpected token '<'")),
  } as unknown as Response);

describe('fetchWithRetry', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('throws a server error when a retryable status keeps returning a non-JSON body', async () => {
    fetchMock.mockResolvedValue(htmlResponse(502));
    const error = await fetchWithRetry('https://example.com', {}, RETRY_CODES).catch(e => e);
    expect(error).toBeInstanceOf(HMSException);
    expect(error.code).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('returns a non-retryable response without retrying when its body is not JSON', async () => {
    const response = htmlResponse(404);
    fetchMock.mockResolvedValue(response);
    await expect(fetchWithRetry('https://example.com', {}, RETRY_CODES)).resolves.toBe(response);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
