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
    const prevWhiteboard = this.store.getWhiteboard(createOptions?.id);
    let id = prevWhiteboard?.id;

    if (!prevWhiteboard) {
      const response = await this.transport.signal.createWhiteboard(this.getCreateOptionsWithDefaults(createOptions));
      id = response.id;
    }
    if (!id) {
      throw new Error(`Whiteboard ID: ${id} not found`);
    }

    const response = await this.transport.signal.getWhiteboard({ id });
    const whiteboard: HMSWhiteboard = {
      ...prevWhiteboard,
      title: createOptions?.title,
      attributes: createOptions?.attributes,
      id: response.id,
      token: response.token,
      addr: response.addr,
      owner: response.owner,
      permissions: response.permissions || [],
      open: true,
    };

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

  // @TODO: change after RBAC is introduced for whiteboard
  private getCreateOptionsWithDefaults(createOptions?: HMSWhiteboardCreateOptions): HMSWhiteboardCreateOptions {
    const roles = Object.keys(this.store.getKnownRoles());
    return {
      title: createOptions?.title || `${this.store.getRoom()?.id} Whiteboard`,
      reader: createOptions?.reader || roles,
      writer: createOptions?.writer || roles,
      admin: createOptions?.admin || roles,
    };
  }
}
