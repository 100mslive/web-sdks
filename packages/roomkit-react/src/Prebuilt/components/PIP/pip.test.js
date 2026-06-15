import { PictureInPicture } from './PIPManager';
import { pickIncomingMessage } from './pipMessageUtils';
import { truncateToWidth } from './pipUtils';

describe('pip manager tests', () => {
  /**
   * Ensure that if a track is showing in both before and after, it's at the
   * same position.
   */
  test('merging old and new tracks to show avoids shuffling', () => {
    const makeTestData = (oldArr, newArr, result) => {
      return { oldArr, newArr, result };
    };

    const examples = [
      makeTestData([1, 5, 9, 3], [3, 8, 2, 9], [8, 2, 9, 3]),
      makeTestData([1, 3, 5], [5, 3, 1], [1, 3, 5]),
      makeTestData([2, 7, 9, 4], [9, 2, 4, 6], [2, 6, 9, 4]),
      makeTestData([1, 2, 3], [4, 5, 6], [4, 5, 6]),
      makeTestData([1, 2], [4, 5, 2, 1], [1, 2, 4, 5]),
      makeTestData([4, 1, 2, 3], [1, 3], [3, 1]),
      makeTestData([4, 5, 1, 3], [1, 3], [1, 3]),
      makeTestData([], [1, 3], [1, 3]),
      makeTestData([1, 3], [], []),
      makeTestData([1], [4, 2, 1, 3], [1, 4, 2, 3]),
      makeTestData([4, 2, 1, 3], [1], [1]),
      makeTestData([], [], []),
    ];

    examples.forEach(example => {
      expect(PictureInPicture.orderNewTracksToShow(example.newArr, example.oldArr)).toEqual(example.result);
    });
  });

  /**
   * It's very important that detach is properly called for old tracks to guarantee
   * no unnecessary bandwidth consumption.
   * For simplicity's sake currently, detach/attach is done if position of
   * the track changes as well. That is earlier it was showing on third position
   * but not it's on second position(because there are only two tracks left to show).
   */
  test('attach and detach are called properly after tracks in view changes', async () => {
    const makeTestData = (oldTracks, newTracks, detachFor, attachFor) => {
      return { oldTracks, newTracks, detachFor, attachFor };
    };

    let attachCalledFor = [];
    let detachCalledFor = [];
    PictureInPicture.hmsActions = {
      attachVideo: jest.fn(track => attachCalledFor.push(track)),
      detachVideo: jest.fn(track => detachCalledFor.push(track)),
    };

    const examples = [
      makeTestData([1, 2], [3, 4], [1, 2], [3, 4]),
      makeTestData([1, 2], [1, 2], [], []),
      makeTestData([1, 5, 9, 3], [8, 2, 9, 3], [1, 5], [8, 2]),
      makeTestData([1, 5, 9], [6, 5, 9], [1], [6]),
      makeTestData([], [1, 3], [], [1, 3]),
      makeTestData([1, 3], [], [1, 3], []),
      makeTestData([1], [4, 2, 1, 3], [1], [4, 2, 1, 3]),
      makeTestData([4, 2, 1, 3], [1], [4, 2, 1, 3], [1]),
      makeTestData([], [], [], []),
    ];

    for (let example of examples) {
      attachCalledFor = [];
      detachCalledFor = [];
      await PictureInPicture.detachOldAttachNewTracks(example.oldTracks, example.newTracks);
      expect(attachCalledFor).toEqual(example.attachFor);
      expect(detachCalledFor).toEqual(example.detachFor);
    }
  });

  /**
   * The incoming chat bubble should be returned by the render loop while it is
   * within its display window and then cleared, so it auto-dismisses.
   */
  describe('incoming chat message bubble', () => {
    afterEach(() => {
      jest.restoreAllMocks();
      PictureInPicture.reset();
    });

    test('latest incoming message is shown then expires after TTL', () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);

      PictureInPicture.setLatestMessage({ senderName: 'Alice', text: 'hello there' });
      expect(PictureInPicture.getActiveMessage()).toEqual({ senderName: 'Alice', text: 'hello there' });

      // still within the display window
      nowSpy.mockReturnValue(1000 + 3999);
      expect(PictureInPicture.getActiveMessage()).toEqual({ senderName: 'Alice', text: 'hello there' });

      // past the display window -> bubble is cleared
      nowSpy.mockReturnValue(1000 + 4000);
      expect(PictureInPicture.getActiveMessage()).toBeNull();
      // once cleared it stays cleared
      expect(PictureInPicture.getActiveMessage()).toBeNull();
    });

    test('no active message by default', () => {
      PictureInPicture.reset();
      expect(PictureInPicture.getActiveMessage()).toBeNull();
    });
  });

  /**
   * Messages can arrive in batches (the store debounces 'newMessage'), so a
   * single subscription fire may carry several new messages. pickIncomingMessage
   * must surface the newest incoming text message in the batch, not just the tail.
   */
  describe('pickIncomingMessage', () => {
    const LOCAL = 'local-peer';
    const msg = (id, sender, message, senderName) => ({ id, sender, message, senderName });

    test('returns the latest incoming text message after lastShownMessageId', () => {
      const messages = [msg('m1', 'p1', 'first', 'Alice'), msg('m2', 'p2', 'second', 'Bob')];
      const result = pickIncomingMessage(messages, 'm1', LOCAL);
      expect(result.message).toEqual({ senderName: 'Bob', text: 'second' });
      expect(result.lastShownMessageId).toBe('m2');
    });

    test('surfaces an incoming message even when the batch tail is our own message', () => {
      // Bug regression: batch ends with the local peer's own message. The earlier
      // incoming peer message must still be shown.
      const messages = [msg('m1', 'p1', 'hi from peer', 'Alice'), msg('m2', LOCAL, 'my reply', 'Me')];
      const result = pickIncomingMessage(messages, undefined, LOCAL);
      expect(result.message).toEqual({ senderName: 'Alice', text: 'hi from peer' });
      // advances past the whole batch so these are not re-scanned
      expect(result.lastShownMessageId).toBe('m2');
    });

    test('ignores own messages and advances past the batch', () => {
      const messages = [msg('m1', LOCAL, 'only mine', 'Me')];
      const result = pickIncomingMessage(messages, undefined, LOCAL);
      expect(result.message).toBeNull();
      expect(result.lastShownMessageId).toBe('m1');
    });

    test('ignores non-text and empty/whitespace messages', () => {
      const messages = [
        msg('m1', 'p1', { fileUrl: 'x' }, 'Alice'), // non-text payload
        msg('m2', 'p2', '   ', 'Bob'), // whitespace only
      ];
      const result = pickIncomingMessage(messages, undefined, LOCAL);
      expect(result.message).toBeNull();
      expect(result.lastShownMessageId).toBe('m2');
    });

    test('returns nothing new when there are no fresh messages', () => {
      const messages = [msg('m1', 'p1', 'seen', 'Alice')];
      const result = pickIncomingMessage(messages, 'm1', LOCAL);
      expect(result.message).toBeNull();
      expect(result.lastShownMessageId).toBe('m1');
    });

    test('handles empty/undefined message lists', () => {
      expect(pickIncomingMessage([], 'm1', LOCAL)).toEqual({ message: null, lastShownMessageId: 'm1' });
      expect(pickIncomingMessage(undefined, undefined, LOCAL)).toEqual({
        message: null,
        lastShownMessageId: undefined,
      });
    });

    test('falls back to Anonymous when senderName is missing', () => {
      const messages = [msg('m1', 'p1', 'hello', undefined)];
      const result = pickIncomingMessage(messages, undefined, LOCAL);
      expect(result.message).toEqual({ senderName: 'Anonymous', text: 'hello' });
    });

    test('when lastShownMessageId is pruned (not found), does not rescan history', () => {
      // Regression: a stale/pruned cursor must not resurface old messages. We
      // advance to the tail and show nothing, rather than slice(0) the whole list.
      const messages = [msg('m1', 'p1', 'old', 'Alice'), msg('m2', 'p2', 'older still', 'Bob')];
      const result = pickIncomingMessage(messages, 'pruned-id', LOCAL);
      expect(result.message).toBeNull();
      expect(result.lastShownMessageId).toBe('m2');
    });
  });

  /**
   * truncateToWidth is pure and injectable (takes a measure fn), so we can test
   * it with a simple 1-unit-per-char stub — no real canvas needed.
   */
  describe('truncateToWidth', () => {
    // each char = 1 unit, ellipsis '…' = 1 unit
    const measure = str => str.length;

    test('returns text unchanged when it fits', () => {
      expect(truncateToWidth(measure, 'hello', 10)).toBe('hello');
      expect(truncateToWidth(measure, 'hello', 5)).toBe('hello');
    });

    test('returns empty string for empty/falsy input', () => {
      expect(truncateToWidth(measure, '', 10)).toBe('');
      expect(truncateToWidth(measure, undefined, 10)).toBe('');
    });

    test('truncates with an ellipsis to fit maxWidth', () => {
      // 'hello world' = 11; maxWidth 6 -> keep 5 chars + '…' = 6
      expect(truncateToWidth(measure, 'hello world', 6)).toBe('hello…');
    });

    test('keeps as many chars as fit (binary search boundary)', () => {
      // maxWidth 4 -> 3 chars + '…' = 4
      expect(truncateToWidth(measure, 'abcdef', 4)).toBe('abc…');
      // maxWidth 1 -> 0 chars + '…' = 1
      expect(truncateToWidth(measure, 'abcdef', 1)).toBe('…');
    });
  });
});
