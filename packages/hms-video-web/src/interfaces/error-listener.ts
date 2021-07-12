import { HMSException } from '../error/HMSException';

export interface IErrorListener {
  onError(error: HMSException): void;
}
