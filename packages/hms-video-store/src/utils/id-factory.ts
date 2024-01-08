import { v4 as uuidv4 } from 'uuid';

export default class HMSIdFactory {
  static makePeerId = () => uuidv4();
}
