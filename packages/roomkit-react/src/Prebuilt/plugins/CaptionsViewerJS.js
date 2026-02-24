import { HMSNotificationTypes, selectPeerNameByID } from '@100mslive/hms-video-store';

/**
 * Manages transcript segments for a single speaker.
 *
 * Holds up to `capacity` transcript entries. Interim (non-final) results
 * update the most recent entry in place. Once a result is marked `final`,
 * subsequent transcripts are pushed as new entries. Final entries auto-expire
 * after `maxStorageTime` ms so stale captions disappear.
 */
class SimpleQueue {
  constructor(capacity = 3, maxStorageTime = 5000) {
    this.capacity = capacity;
    this.MAX_STORAGE_TIME = maxStorageTime;
    this.storage = [];
  }

  /**
   * Add or update a transcript segment.
   * - Empty transcripts are ignored.
   * - If the queue is full and the last entry is final, evict it.
   * - If the last entry is still interim, update it in place.
   * - If the last entry is final, push a new entry.
   */
  enqueue(data) {
    if (!data.transcript.trim()) {
      return;
    }
    // Evict oldest final entry when at capacity
    if (this.size() === this.capacity && this.storage[this.size() - 1].final) {
      this.dequeue(this.storage[this.size() - 1]);
    }
    // First entry — just push
    if (this.size() === 0) {
      this.storage.push(data);
      this._addTimeout(this.storage[this.size() - 1], data.final);
      return;
    }
    // Previous entry was final — start a new segment
    if (this.size() > 0 && this.storage[this.size() - 1]?.final === true) {
      this.storage.push(data);
      this._addTimeout(this.storage[this.size() - 1], data.final);
      return;
    }
    // Previous entry is still interim — update it in place
    this.storage[this.size() - 1].transcript = data.transcript;
    this.storage[this.size() - 1].final = data.final;
    this.storage[this.size() - 1].end = data.end;
    this._addTimeout(this.storage[this.size() - 1], data.final);
  }

  /** Schedule auto-removal for final entries after MAX_STORAGE_TIME. */
  _addTimeout(item, isFinal) {
    if (!isFinal) return;
    item.timeout = setTimeout(() => {
      this.dequeue(item);
    }, this.MAX_STORAGE_TIME);
  }

  /** Remove a specific entry and clear its expiry timer. */
  dequeue(item) {
    const index = this.storage.indexOf(item);
    if (index === -1) return undefined;
    const removed = this.storage.splice(index, 1);
    if (removed.length <= 0) return undefined;
    this._clearTimeout(removed[0]);
    return item;
  }

  _clearTimeout(item) {
    if (item?.timeout) clearTimeout(item.timeout);
  }

  /** Concatenate all stored transcript segments into a single string. */
  getTranscription() {
    let script = '';
    this.storage.forEach(value => (script += value.transcript + ' '));
    return script;
  }

  reset() {
    this.storage.length = 0;
  }

  size() {
    return this.storage.length;
  }
}

/**
 * Top-level queue that maps peer_id → SimpleQueue.
 *
 * Each speaking peer gets their own SimpleQueue for managing transcript
 * segments. Limited to `capacity` concurrent speakers — when exceeded,
 * the oldest speaker's data is evicted.
 */
class Queue {
  constructor(capacity = 3) {
    this.capacity = capacity;
    this.storage = {};
  }

  /** Route a transcript entry to the correct per-speaker SimpleQueue. */
  enqueue(data) {
    if (this.size() === this.capacity) {
      this.dequeue();
    }
    if (!this.storage[data.peer_id]) {
      this.storage[data.peer_id] = {
        peer_id: data.peer_id,
        transcript: data.transcript,
        final: data.final,
        transcriptQueue: new SimpleQueue(),
        start: data.start,
        end: data.end,
      };
      this.storage[data.peer_id].transcriptQueue.enqueue(data);
      return;
    }
    this.storage[data.peer_id].transcriptQueue.enqueue(data);
  }

  /** Evict the oldest speaker (FIFO order based on insertion). */
  dequeue() {
    const key = Object.keys(this.storage).shift() || '';
    const captionData = this.storage[key];
    captionData.transcriptQueue.reset();
    delete this.storage[key];
    return captionData;
  }

  /**
   * Return an array of { peer_id: concatenated_transcript } objects
   * for all currently tracked speakers.
   */
  findPeerData() {
    const keys = Object.keys(this.storage);
    return keys.map(key => {
      const word = this.storage[key].transcriptQueue.getTranscription();
      return { [key]: word };
    });
  }

  size() {
    return Object.keys(this.storage).length;
  }
}

/**
 * Plain JS captions viewer — no React dependency.
 *
 * Subscribes to HMS transcript notifications, queues them per speaker,
 * and renders caption text into a draggable overlay using vanilla DOM.
 *
 * Usage:
 *   const viewer = new CaptionsViewerJS({
 *     notifications, // HMSNotifications from hmsReactiveStore.getNotifications()
 *     store,         // HMSStore from hmsReactiveStore.getStore()
 *     containerEl,   // DOM element to mount into (should be position:relative)
 *   });
 *
 *   viewer.show();    // make visible (called when CC is toggled on)
 *   viewer.hide();    // hide (called when CC is toggled off)
 *   viewer.destroy(); // clean up listeners, timers, and DOM
 */
export class CaptionsViewerJS {
  constructor({ notifications, store, containerEl }) {
    this.notifications = notifications;
    this.store = store;
    this.containerEl = containerEl;
    this.captionQueue = new Queue();
    this.unsubscribe = null;
    this.pollInterval = null;
    this.el = null;
    this._dragState = null;

    this._createDOM();
    this._subscribe();
    this._startPolling();
  }

  /**
   * Create the caption overlay element and append it to the container.
   * Styled as a semi-transparent black box at the bottom-center,
   * 40% width on desktop, 100% on mobile.
   */
  _createDOM() {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'absolute',
      width: window.innerWidth <= 768 ? '100%' : '40%',
      bottom: '0',
      left: window.innerWidth <= 768 ? '0' : '50%',
      transform: window.innerWidth <= 768 ? '' : 'translateX(-50%)',
      background: '#000000A3',
      overflow: 'clip',
      zIndex: '10',
      color: '#FFFFFFD9',
      height: 'fit-content',
      borderRadius: '4px',
      padding: '12px',
      display: 'none',
      cursor: 'grab',
      userSelect: 'none',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '14px',
      lineHeight: '1.4',
    });
    this.el.setAttribute('data-testid', 'captions_viewer_js');

    // Bind drag handlers
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this.el.addEventListener('pointerdown', this._onPointerDown);

    this.containerEl.appendChild(this.el);
  }

  /** Drag start — capture pointer and record initial position. */
  _onPointerDown(e) {
    this._dragState = {
      startX: e.clientX,
      startY: e.clientY,
      origLeft: this.el.offsetLeft,
      origTop: this.el.offsetTop,
    };
    this.el.style.cursor = 'grabbing';
    this.el.setPointerCapture(e.pointerId);
    this.el.addEventListener('pointermove', this._onPointerMove);
    this.el.addEventListener('pointerup', this._onPointerUp);
  }

  /** Drag move — reposition element based on pointer delta. */
  _onPointerMove(e) {
    if (!this._dragState) return;
    const dx = e.clientX - this._dragState.startX;
    const dy = e.clientY - this._dragState.startY;
    // Reset transform so left/top work predictably
    this.el.style.transform = 'none';
    this.el.style.left = `${this._dragState.origLeft + dx}px`;
    this.el.style.top = `${this._dragState.origTop + dy}px`;
    this.el.style.bottom = 'auto';
  }

  /** Drag end — release pointer capture and clean up move/up listeners. */
  _onPointerUp(e) {
    this._dragState = null;
    this.el.style.cursor = 'grab';
    this.el.releasePointerCapture(e.pointerId);
    this.el.removeEventListener('pointermove', this._onPointerMove);
    this.el.removeEventListener('pointerup', this._onPointerUp);
  }

  /**
   * Subscribe to HMS NEW_MESSAGE notifications.
   * Filters for messages of type 'hms_transcript', parses the JSON payload,
   * and enqueues each transcript result (which contains peer_id, transcript
   * text, and whether it's a final or interim result).
   */
  _subscribe() {
    this.unsubscribe = this.notifications.onNotification(notification => {
      const msg = notification.data;
      if (msg && msg.type === 'hms_transcript') {
        try {
          const message = JSON.parse(msg.message);
          const data = message.results;
          if (data) {
            data.forEach(item => this.captionQueue.enqueue(item));
          }
        } catch (err) {
          console.error('[CaptionsViewerJS] Failed to parse transcript:', err);
        }
      }
    }, HMSNotificationTypes.NEW_MESSAGE);
  }

  /** Poll the queue every second and update the DOM with current captions. */
  _startPolling() {
    this.pollInterval = setInterval(() => {
      this._render();
    }, 1000);
  }

  /** Resolve a peer_id to a display name via the HMS store. */
  _getPeerName(peerId) {
    try {
      return this.store.getState(selectPeerNameByID(peerId)) || 'Participant';
    } catch {
      return 'Participant';
    }
  }

  /**
   * Re-render caption lines into the overlay element.
   * Hides the element when there's nothing to show.
   * Each line displays: "PeerName: transcript text"
   */
  _render() {
    const peerData = this.captionQueue.findPeerData();
    const filtered = peerData.filter(entry => {
      const key = Object.keys(entry)[0];
      return entry[key]?.trim();
    });

    if (filtered.length === 0) {
      this.el.style.display = 'none';
      return;
    }

    this.el.style.display = 'block';
    this.el.innerHTML = '';

    filtered.forEach(entry => {
      const peerId = Object.keys(entry)[0];
      const text = entry[peerId].trim();
      if (!text) return;

      const line = document.createElement('div');
      line.style.marginBottom = '2px';

      const nameSpan = document.createElement('b');
      nameSpan.textContent = this._getPeerName(peerId) + ': ';
      line.appendChild(nameSpan);

      const textNode = document.createTextNode(text);
      line.appendChild(textNode);

      this.el.appendChild(line);
    });
  }

  /** Make the caption overlay visible and trigger a render. */
  show() {
    this.el.style.display = '';
    this._render();
  }

  /** Hide the caption overlay. */
  hide() {
    this.el.style.display = 'none';
  }

  /** Clean up: unsubscribe from notifications, clear polling, remove DOM element. */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.el.removeEventListener('pointerdown', this._onPointerDown);
    if (this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}
