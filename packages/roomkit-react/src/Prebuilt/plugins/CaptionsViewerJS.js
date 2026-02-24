import { HMSNotificationTypes, selectPeerNameByID } from '@100mslive/hms-video-store';

class SimpleQueue {
  constructor(capacity = 3, maxStorageTime = 5000) {
    this.capacity = capacity;
    this.MAX_STORAGE_TIME = maxStorageTime;
    this.storage = [];
  }

  enqueue(data) {
    if (!data.transcript.trim()) {
      return;
    }
    if (this.size() === this.capacity && this.storage[this.size() - 1].final) {
      this.dequeue(this.storage[this.size() - 1]);
    }
    if (this.size() === 0) {
      this.storage.push(data);
      this._addTimeout(this.storage[this.size() - 1], data.final);
      return;
    }
    if (this.size() > 0 && this.storage[this.size() - 1]?.final === true) {
      this.storage.push(data);
      this._addTimeout(this.storage[this.size() - 1], data.final);
      return;
    }
    this.storage[this.size() - 1].transcript = data.transcript;
    this.storage[this.size() - 1].final = data.final;
    this.storage[this.size() - 1].end = data.end;
    this._addTimeout(this.storage[this.size() - 1], data.final);
  }

  _addTimeout(item, isFinal) {
    if (!isFinal) return;
    item.timeout = setTimeout(() => {
      this.dequeue(item);
    }, this.MAX_STORAGE_TIME);
  }

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

class Queue {
  constructor(capacity = 3) {
    this.capacity = capacity;
    this.storage = {};
  }

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

  dequeue() {
    const key = Object.keys(this.storage).shift() || '';
    const captionData = this.storage[key];
    captionData.transcriptQueue.reset();
    delete this.storage[key];
    return captionData;
  }

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
 * Usage:
 *   const viewer = new CaptionsViewerJS({
 *     notifications, // HMSNotifications from hmsReactiveStore.getNotifications()
 *     store,         // HMSStore from hmsReactiveStore.getStore()
 *     containerEl,   // DOM element to mount into (should be position:relative)
 *   });
 *
 *   // later:
 *   viewer.destroy();
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

    // drag state
    this._dragState = null;

    this._createDOM();
    this._subscribe();
    this._startPolling();
  }

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

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this.el.addEventListener('pointerdown', this._onPointerDown);

    this.containerEl.appendChild(this.el);
  }

  // -- drag via pointer events --
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

  _onPointerUp(e) {
    this._dragState = null;
    this.el.style.cursor = 'grab';
    this.el.releasePointerCapture(e.pointerId);
    this.el.removeEventListener('pointermove', this._onPointerMove);
    this.el.removeEventListener('pointerup', this._onPointerUp);
  }

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

  _startPolling() {
    this.pollInterval = setInterval(() => {
      this._render();
    }, 1000);
  }

  _getPeerName(peerId) {
    try {
      return this.store.getState(selectPeerNameByID(peerId)) || 'Participant';
    } catch {
      return 'Participant';
    }
  }

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

  show() {
    this.el.style.display = '';
    this._render();
  }

  hide() {
    this.el.style.display = 'none';
  }

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
