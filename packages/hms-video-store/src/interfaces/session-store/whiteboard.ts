import { HMSPermissionType } from '../role';

export interface HMSWhiteboardCreateOptions {
  id?: string; // unique whiteboard id generated by SDK, use to open previously created whiteboard
  title?: string;
  reader?: string[]; // list of roles that can view whiteboard
  writer?: string[]; // list of roles that can edit whiteboard
  admin?: string[]; // list of roles that can close whiteboard
  presence?: boolean; // enable presence tracking
  attributes?: Array<{ name: string; value: unknown }>;
}

export interface HMSWhiteboard {
  id: string; // unique whiteboard id generated by backend
  open?: boolean; // whether whiteboard is open or not
  title?: string;
  owner?: string; // user id for whiteboard owner
  addr?: string; // address to be used to connect to whiteboard service
  token?: string; // security token to be used for whiteboard API
  permissions?: Array<HMSPermissionType>;
  presence?: boolean;
  attributes?: Array<{ name: string; value: unknown }>;
}
