import { HMSWhiteboard, InteractivityListener } from '../../interfaces';
import { HMSWhiteboardInteractivityCenter } from '../../interfaces/session-store/interactivity-center';
import { Store } from '../../sdk/store';
import { InitFlags } from '../../signal/init/models';
import { HMSWhiteboardCreateOptions } from '../../signal/interfaces';
import HMSTransport from '../../transport';
import HMSLogger from '../../utils/logger';

export class WhiteboardInteractivityCenter implements HMSWhiteboardInteractivityCenter {
  private TAG = '[HMSWhiteboardInteractivityCenter]';
  constructor(
    private readonly transport: HMSTransport,
    private store: Store,
    private listener?: InteractivityListener,
  ) {}

  // @TODO: remove when whiteboard released for general audience
  get isEnabled() {
    return this.transport.isFlagEnabled(InitFlags.FLAG_WHITEBOARD_ENABLED);
  }

  async open(createOptions?: HMSWhiteboardCreateOptions) {
    if (!this.isEnabled) {
      return HMSLogger.w(this.TAG, 'Whiteboard is not enabled for customer');
    }
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
    if (!this.isEnabled) {
      return HMSLogger.w(this.TAG, 'Whiteboard is not enabled for customer');
    }

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

  private getCreateOptionsWithDefaults(createOptions?: HMSWhiteboardCreateOptions): HMSWhiteboardCreateOptions {
    const roles = Object.values(this.store.getKnownRoles());
    const reader: Array<string> = [];
    const writer: Array<string> = [];
    const admin: Array<string> = [];

    roles.forEach(role => {
      if (role.permissions.whiteboard?.includes('read')) {
        reader.push(role.name);
      }
      if (role.permissions.whiteboard?.includes('write')) {
        writer.push(role.name);
      }
      if (role.permissions.whiteboard?.includes('admin')) {
        admin.push(role.name);
      }
    });

    return {
      title: createOptions?.title || `${this.store.getRoom()?.id} Whiteboard`,
      reader: createOptions?.reader || reader,
      writer: createOptions?.writer || writer,
      admin: createOptions?.admin || admin,
    };
  }
}
