import { InteractivityListener } from '../../interfaces';
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

  async openWhiteboard(createOptions?: HMSWhiteboardCreateOptions) {
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

    const whiteboard = await this.transport.signal.getWhiteboard({ id });

    this.listener?.onWhiteboardUpdate({ ...whiteboard, open: true });
  }
}
