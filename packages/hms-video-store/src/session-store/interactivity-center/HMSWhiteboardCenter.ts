import { HMSWhiteboard, InteractivityListener } from '../../interfaces';
import { HMSWhiteboardInteractivityCenter } from '../../interfaces/session-store/interactivity-center';
import { Store } from '../../sdk/store';
import { HMSWhiteboardCreateOptions } from '../../signal/interfaces';
import HMSTransport from '../../transport';

export class WhiteboardInteractivityCenter implements HMSWhiteboardInteractivityCenter {
  constructor(
    private readonly transport: HMSTransport,
    private store: Store,
    private listener?: InteractivityListener,
  ) {}

  async open(createOptions?: HMSWhiteboardCreateOptions) {
    let id = createOptions?.id || this.store.getWhiteboard()?.id;

    if (!id) {
      const response = await this.transport.signal.createWhiteboard(
        createOptions || {
          title: `${this.store.getRoom()?.id} Whiteboard`,
        },
      );
      id = response.id;
    }
    if (!id) {
      throw new Error(`Whiteboard ID: ${id} not found`);
    }

    const response = await this.transport.signal.getWhiteboard({ id });
    const whiteboard = { ...response, open: true };

    this.store.setWhiteboard(whiteboard);
    this.listener?.onWhiteboardUpdate(whiteboard);
  }

  async close(id?: string) {
    const prevWhiteboard = this.store.getWhiteboard(id);
    if (!prevWhiteboard) {
      throw new Error(`Whiteboard ID: ${id} not found`);
    }
    const whiteboard: HMSWhiteboard = { id: prevWhiteboard.id, title: prevWhiteboard.title, open: false };

    this.store.setWhiteboard(whiteboard);
    this.listener?.onWhiteboardUpdate(whiteboard);
  }

  setListener(listener?: InteractivityListener) {
    this.listener = listener;
  }
}
