import { v4 as uuid } from 'uuid';
import { convertSignalMethodtoErrorAction, HMSSignalMethod, JsonRpcRequest, JsonRpcResponse } from './models';
import AnalyticsEvent from '../../analytics/AnalyticsEvent';
import { HMSConnectionRole, HMSTrickle } from '../../connection/model';
import { ErrorFactory } from '../../error/ErrorFactory';
import { HMSAction } from '../../error/HMSAction';
import { HMSException } from '../../error/HMSException';
import { SendMessage } from '../../notification-manager';
import {
  DEFAULT_SIGNAL_PING_INTERVAL,
  DEFAULT_SIGNAL_PING_TIMEOUT,
  PONG_RESPONSE_TIMES_SIZE,
} from '../../utils/constants';
import HMSLogger from '../../utils/logger';
import { PromiseCallbacks } from '../../utils/promise';
import { Queue } from '../../utils/queue';
import { isPageHidden } from '../../utils/support';
import { workerSleep } from '../../utils/timer-utils';
import {
  AcceptRoleChangeParams,
  BroadcastResponse,
  CreateWhiteboardResponse,
  findPeersRequestParams,
  getPeerRequestParams,
  GetSessionMetadataResponse,
  GetWhiteboardResponse,
  HLSRequestParams,
  HLSTimedMetadataParams,
  HMSPermissionType,
  HMSWhiteboardCreateOptions,
  JoinLeaveGroupResponse,
  MultiTrackUpdateRequestParams,
  peerIterRequestParams,
  PeersIterationResponse,
  PollInfoGetParams,
  PollInfoGetResponse,
  PollInfoSetParams,
  PollInfoSetResponse,
  PollLeaderboardGetParams,
  PollLeaderboardGetResponse,
  PollListParams,
  PollListResponse,
  PollQuestionsGetParams,
  PollQuestionsGetResponse,
  PollQuestionsSetParams,
  PollQuestionsSetResponse,
  PollResponseSetParams,
  PollResponseSetResponse,
  PollResponsesGetParams,
  PollResponsesGetResponse,
  PollResultParams,
  PollResultResponse,
  PollStartParams,
  PollStartResponse,
  PollStopParams,
  PollStopResponse,
  RemovePeerRequest,
  RequestForBulkRoleChangeParams,
  RequestForRoleChangeParams,
  SetSessionMetadataParams,
  SetSessionMetadataResponse,
  StartRTMPOrRecordingRequestParams,
  Track,
  TrackUpdateRequestParams,
  UpdatePeerRequestParams,
} from '../interfaces';
import { ISignalEventsObserver } from '../ISignalEventsObserver';

export default class JsonRpcSignal {
  readonly TAG = '[SIGNAL]: ';
  readonly observer: ISignalEventsObserver;
  readonly pongResponseTimes = new Queue<number>(PONG_RESPONSE_TIMES_SIZE);

  /**
   * Sometimes before [join] is completed, there could be a lot of trickles
   * Sending [HMSTrickle]` before [join] web socket message leads to
   * error: [500] no rtc transport exists for this Peer
   *
   * We keep a list of pending trickles and send them immediately after [join]
   * is done.
   */
  private isJoinCompleted = false;
  private pendingTrickle: Array<HMSTrickle> = [];

  private socket: WebSocket | null = null;

  private callbacks = new Map<string, PromiseCallbacks<string, { method: HMSSignalMethod }>>();

  private _isConnected = false;
  private id = 0;

  private onCloseHandler: (event: CloseEvent) => void = () => {};

  public get isConnected(): boolean {
    return this._isConnected;
  }

  public setIsConnected(newValue: boolean, reason = '') {
    HMSLogger.d(this.TAG, `isConnected set id: ${this.id}, oldValue: ${this._isConnected}, newValue: ${newValue}`);
    if (this._isConnected === newValue) {
      return;
    }

    if (this._isConnected && !newValue) {
      // went offline
      this._isConnected = newValue;
      this.rejectPendingCalls(reason);
      this.observer.onOffline(reason);
    } else if (!this._isConnected && newValue) {
      // went online
      this._isConnected = newValue;
      this.observer.onOnline();
    }
  }

  constructor(observer: ISignalEventsObserver) {
    this.observer = observer;
    window.addEventListener('offline', this.offlineListener);
    window.addEventListener('online', this.onlineListener);

    this.onMessageHandler = this.onMessageHandler.bind(this);
  }

  getPongResponseTimes() {
    return this.pongResponseTimes.toList();
  }

  private async internalCall<T>(method: string, params: any): Promise<T> {
    const id = uuid();
    const message = { method, params, id, jsonrpc: '2.0' } as JsonRpcRequest;

    this.socket?.send(JSON.stringify(message));

    try {
      const response = await new Promise<any>((resolve, reject) => {
        this.callbacks.set(id, { resolve, reject, metadata: { method: method as HMSSignalMethod } });
      });

      return response;
    } catch (ex) {
      if (ex instanceof HMSException) {
        throw ex;
      }

      const error = ex as JsonRpcResponse['error'];
      throw ErrorFactory.WebsocketMethodErrors.ServerErrors(
        Number(error.code),
        convertSignalMethodtoErrorAction(method as HMSSignalMethod),
        error.message,
      );
    }
  }

  private notify(method: string, params: any) {
    const message = { method, params };

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket?.send(JSON.stringify(message));
    }
  }

  open(uri: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let promiseSettled = false;
      // cleanup
      if (this.socket) {
        this.socket.close();
        this.socket.removeEventListener('close', this.onCloseHandler);
        this.socket.removeEventListener('message', this.onMessageHandler);
      }

      this.socket = new WebSocket(uri); // @DISCUSS: Inject WebSocket as a dependency so that it can be easier to mock and test

      const errorListener = () => {
        /**
         * there was an error received from websocket leading to disconnection, this can happen either if server
         * disconnects the websocket for some reason, there is a network disconnect or a firewall/antivirus on user's
         * device is breaking the websocket connecting(which can happen even after a successful connect).
         */
        HMSLogger.e(this.TAG, 'Error from websocket');
        promiseSettled = true;
        // above error does not contain any description hence not sent here
        reject(
          ErrorFactory.WebSocketConnectionErrors.FailedToConnect(HMSAction.JOIN, `Error opening websocket connection`),
        );
      };

      this.onCloseHandler = (event: CloseEvent) => {
        HMSLogger.w(`Websocket closed code=${event.code}`);
        if (promiseSettled) {
          this.setIsConnected(false, `code: ${event.code}${event.code !== 1000 ? ', unexpected websocket close' : ''}`);
        } else {
          promiseSettled = true;
          reject(
            ErrorFactory.WebSocketConnectionErrors.AbnormalClose(
              HMSAction.JOIN,
              `Error opening websocket connection - websocket closed unexpectedly with code=${event.code}`,
            ),
          );
        }
      };

      this.socket.addEventListener('error', errorListener);

      const openHandler = () => {
        promiseSettled = true;
        resolve();
        this.setIsConnected(true);
        this.id++;
        this.socket?.removeEventListener('open', openHandler);
        this.socket?.removeEventListener('error', errorListener);
        this.pingPongLoop(this.id);
      };

      this.socket.addEventListener('open', openHandler);
      this.socket.addEventListener('close', this.onCloseHandler);
      this.socket.addEventListener('message', this.onMessageHandler);
    });
  }

  async close(): Promise<void> {
    window.removeEventListener('offline', this.offlineListener);
    window.removeEventListener('online', this.onlineListener);

    // For `1000` Refer: https://tools.ietf.org/html/rfc6455#section-7.4.1
    if (this.socket) {
      this.socket.close(1000, 'Normal Close');
      this.setIsConnected(false, 'code: 1000, normal websocket close');
      this.socket.removeEventListener('close', this.onCloseHandler);
      this.socket.removeEventListener('message', this.onMessageHandler);
    } else {
      this.setIsConnected(false, 'websocket not connected yet');
    }
  }

  async join(
    name: string,
    data: string,
    disableVidAutoSub: boolean,
    serverSubDegrade: boolean,
    simulcast: boolean,
    onDemandTracks: boolean,
    offer?: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit> {
    if (!this.isConnected) {
      throw ErrorFactory.WebSocketConnectionErrors.WebSocketConnectionLost(
        HMSAction.JOIN,
        'Failed to send join over WS connection',
      );
    }
    const params = {
      name,
      disableVidAutoSub,
      data,
      offer,
      server_sub_degrade: serverSubDegrade,
      simulcast,
      onDemandTracks,
    };
    const response: RTCSessionDescriptionInit = await this.internalCall(HMSSignalMethod.JOIN, params);

    this.isJoinCompleted = true;
    this.pendingTrickle.forEach(({ target, candidate }) => this.trickle(target, candidate));
    this.pendingTrickle.length = 0;

    HMSLogger.d(this.TAG, `join: response=${JSON.stringify(response, null, 1)}`);
    return response;
  }

  trickle(target: HMSConnectionRole, candidate: RTCIceCandidateInit) {
    if (this.isJoinCompleted) {
      this.notify(HMSSignalMethod.TRICKLE, { target, candidate });
    } else {
      this.pendingTrickle.push({ target, candidate });
    }
  }

  async offer(desc: RTCSessionDescriptionInit, tracks: Map<string, any>): Promise<RTCSessionDescriptionInit> {
    const response = await this.call(HMSSignalMethod.OFFER, {
      desc,
      tracks: Object.fromEntries(tracks),
    });
    return response as RTCSessionDescriptionInit;
  }

  answer(desc: RTCSessionDescriptionInit) {
    this.notify(HMSSignalMethod.ANSWER, { desc });
  }

  trackUpdate(tracks: Map<string, Track>) {
    this.notify(HMSSignalMethod.TRACK_UPDATE, { tracks: Object.fromEntries(tracks) });
  }

  async broadcast(message: SendMessage) {
    return await this.call<BroadcastResponse>(HMSSignalMethod.BROADCAST, message);
  }

  leave() {
    this.notify(HMSSignalMethod.LEAVE, {});
  }

  async endRoom(lock: boolean, reason: string) {
    await this.call(HMSSignalMethod.END_ROOM, { lock, reason });
  }

  sendEvent(event: AnalyticsEvent) {
    if (!this.isConnected) {
      throw Error(`${this.TAG} not connected. Could not send event ${event}`);
    }
    this.notify(HMSSignalMethod.ANALYTICS, event.toSignalParams());
  }

  ping(timeout: number): Promise<number> {
    const pingTime = Date.now();
    const timer: Promise<number> = new Promise(resolve => {
      setTimeout(() => {
        resolve(Date.now() - pingTime);
      }, timeout + 1);
    });
    const pongTimeDiff = this.internalCall(HMSSignalMethod.PING, { timestamp: pingTime })
      .then(() => Date.now() - pingTime)
      .catch(() => Date.now() - pingTime);

    return Promise.race([timer, pongTimeDiff]);
  }

  async requestRoleChange(params: RequestForRoleChangeParams) {
    await this.call(HMSSignalMethod.ROLE_CHANGE_REQUEST, params);
  }

  async requestBulkRoleChange(params: RequestForBulkRoleChangeParams) {
    await this.call(HMSSignalMethod.ROLE_CHANGE_REQUEST, params);
  }

  async acceptRoleChangeRequest(params: AcceptRoleChangeParams) {
    await this.call(HMSSignalMethod.ROLE_CHANGE, params);
  }

  async requestTrackStateChange(params: TrackUpdateRequestParams) {
    await this.call(HMSSignalMethod.TRACK_UPDATE_REQUEST, params);
  }

  async requestMultiTrackStateChange(params: MultiTrackUpdateRequestParams) {
    await this.call(HMSSignalMethod.CHANGE_TRACK_MUTE_STATE_REQUEST, params);
  }

  async removePeer(params: RemovePeerRequest) {
    await this.call(HMSSignalMethod.PEER_LEAVE_REQUEST, params);
  }

  async startRTMPOrRecording(params: StartRTMPOrRecordingRequestParams) {
    await this.call(HMSSignalMethod.START_RTMP_OR_RECORDING_REQUEST, { ...params });
  }

  async stopRTMPAndRecording() {
    await this.call(HMSSignalMethod.STOP_RTMP_AND_RECORDING_REQUEST, {});
  }

  async startHLSStreaming(params: HLSRequestParams): Promise<void> {
    await this.call(HMSSignalMethod.START_HLS_STREAMING, { ...params });
  }

  async stopHLSStreaming(params?: HLSRequestParams): Promise<void> {
    await this.call(HMSSignalMethod.STOP_HLS_STREAMING, { ...params });
  }

  async sendHLSTimedMetadata(params?: HLSTimedMetadataParams): Promise<void> {
    await this.call(HMSSignalMethod.HLS_TIMED_METADATA, { ...params });
  }

  async updatePeer(params: UpdatePeerRequestParams) {
    await this.call(HMSSignalMethod.UPDATE_PEER_METADATA, { ...params });
  }

  async getPeer(params: getPeerRequestParams) {
    await this.call(HMSSignalMethod.GET_PEER, { ...params });
  }

  async joinGroup(name: string): Promise<JoinLeaveGroupResponse> {
    return await this.call(HMSSignalMethod.GROUP_JOIN, { name });
  }

  async leaveGroup(name: string): Promise<JoinLeaveGroupResponse> {
    return await this.call(HMSSignalMethod.GROUP_LEAVE, { name });
  }

  async addToGroup(peerId: string, name: string) {
    await this.call(HMSSignalMethod.GROUP_ADD, { name, peer_id: peerId });
  }

  async removeFromGroup(peerId: string, name: string): Promise<void> {
    await this.call(HMSSignalMethod.GROUP_REMOVE, { name, peer_id: peerId });
  }

  async peerIterNext(params: peerIterRequestParams): Promise<PeersIterationResponse> {
    return await this.call(HMSSignalMethod.PEER_ITER_NEXT, params);
  }

  async findPeers(params: findPeersRequestParams): Promise<PeersIterationResponse> {
    return await this.call(HMSSignalMethod.FIND_PEER, params);
  }

  setSessionMetadata(params: SetSessionMetadataParams) {
    if (!this.isConnected) {
      throw ErrorFactory.WebSocketConnectionErrors.WebSocketConnectionLost(
        HMSAction.RECONNECT_SIGNAL,
        'Failed to set session store value due to network disconnection',
      );
    }
    return this.call<SetSessionMetadataResponse>(HMSSignalMethod.SET_METADATA, { ...params });
  }

  listenMetadataChange(keys: string[]): Promise<void> {
    if (!this.isConnected) {
      throw ErrorFactory.WebSocketConnectionErrors.WebSocketConnectionLost(
        HMSAction.RECONNECT_SIGNAL,
        'Failed to observe session store key due to network disconnection',
      );
    }
    return this.call(HMSSignalMethod.LISTEN_METADATA_CHANGE, { keys });
  }

  getSessionMetadata(key?: string) {
    if (!this.isConnected) {
      throw ErrorFactory.WebSocketConnectionErrors.WebSocketConnectionLost(
        HMSAction.RECONNECT_SIGNAL,
        'Failed to set session store value due to network disconnection',
      );
    }
    return this.call<GetSessionMetadataResponse>(HMSSignalMethod.GET_METADATA, { key });
  }

  setPollInfo(params: PollInfoSetParams) {
    return this.call<PollInfoSetResponse>(HMSSignalMethod.POLL_INFO_SET, { ...params });
  }

  getPollInfo(params: PollInfoGetParams) {
    return this.call<PollInfoGetResponse>(HMSSignalMethod.POLL_INFO_GET, { ...params });
  }

  setPollQuestions(params: PollQuestionsSetParams) {
    return this.call<PollQuestionsSetResponse>(HMSSignalMethod.POLL_QUESTIONS_SET, { ...params });
  }

  startPoll(params: PollStartParams) {
    return this.call<PollStartResponse>(HMSSignalMethod.POLL_START, { ...params });
  }

  stopPoll(params: PollStopParams) {
    return this.call<PollStopResponse>(HMSSignalMethod.POLL_STOP, { ...params });
  }

  getPollQuestions(params: PollQuestionsGetParams): Promise<PollQuestionsGetResponse> {
    return this.call<PollQuestionsGetResponse>(HMSSignalMethod.POLL_QUESTIONS_GET, { ...params });
  }

  setPollResponses(params: PollResponseSetParams): Promise<PollResponseSetResponse> {
    return this.call<PollResponseSetResponse>(HMSSignalMethod.POLL_RESPONSE_SET, { ...params });
  }

  getPollResponses(params: PollResponsesGetParams): Promise<PollResponsesGetResponse> {
    return this.call<PollResponsesGetResponse>(HMSSignalMethod.POLL_RESPONSES, { ...params });
  }

  getPollsList(params: PollListParams): Promise<PollListResponse> {
    return this.call<PollListResponse>(HMSSignalMethod.POLL_LIST, { ...params });
  }

  getPollResult(params: PollResultParams): Promise<PollResultResponse> {
    return this.call<PollResultResponse>(HMSSignalMethod.POLL_RESULT, { ...params });
  }

  createWhiteboard(params: HMSWhiteboardCreateOptions) {
    this.validateConnection();
    return this.call<CreateWhiteboardResponse>(HMSSignalMethod.WHITEBOARD_CREATE, { ...params });
  }

  getWhiteboard(params: { id: string; permission?: Array<HMSPermissionType> }) {
    this.validateConnection();
    return this.call<GetWhiteboardResponse>(HMSSignalMethod.WHITEBOARD_GET, { ...params });
  }

  fetchPollLeaderboard(params: PollLeaderboardGetParams): Promise<PollLeaderboardGetResponse> {
    return this.call<PollLeaderboardGetResponse>(HMSSignalMethod.POLL_LEADERBOARD, { ...params });
  }

  private validateConnection() {
    if (!this.isConnected) {
      throw ErrorFactory.WebSocketConnectionErrors.WebSocketConnectionLost(
        HMSAction.RECONNECT_SIGNAL,
        'Failed to send message due to network disconnection',
      );
    }
  }

  private onMessageHandler(event: MessageEvent) {
    const text: string = event.data;
    const response = JSON.parse(text);
    this.resolvePingOnAnyResponse();
    if (response.id) {
      this.handleResponseWithId(response);
    } else if (response.method) {
      this.handleResponseWithMethod(response);
    } else {
      throw Error(`WebSocket message has no 'method' or 'id' field, message=${response}`);
    }
  }

  private handleResponseWithId(response: any) {
    /** This is a response to [call] */
    const typedResponse = response as JsonRpcResponse;
    const id: string = typedResponse.id;
    if (this.callbacks.has(id)) {
      const cb = this.callbacks.get(id)!;
      this.callbacks.delete(id);
      if (typedResponse.result) {
        cb.resolve(typedResponse.result);
      } else {
        cb.reject(typedResponse.error);
      }
    } else {
      this.observer.onNotification(typedResponse);
    }
  }

  private handleResponseWithMethod(response: any) {
    switch (response.method) {
      case HMSSignalMethod.OFFER:
        this.observer.onOffer(response.params);
        break;
      case HMSSignalMethod.TRICKLE:
        this.observer.onTrickle(response.params);
        break;
      case HMSSignalMethod.SERVER_ERROR:
        this.observer.onServerError(
          ErrorFactory.WebsocketMethodErrors.ServerErrors(
            Number(response.params.code),
            HMSSignalMethod.SERVER_ERROR,
            response.params.message,
          ),
        );
        break;
      case HMSSignalMethod.SERVER_WARNING:
        HMSLogger.w(this.TAG, response.params);
        break;
      default:
        this.observer.onNotification(response);
        break;
    }
  }

  private resolvePingOnAnyResponse = () => {
    this.callbacks.forEach((callback, key) => {
      if (callback.metadata?.method === HMSSignalMethod.PING) {
        //@ts-ignore
        callback.resolve({ timestamp: Date.now() });
        this.callbacks.delete(key);
      }
    });
  };

  private rejectPendingCalls(reason = '') {
    this.callbacks.forEach((callback, id) => {
      if (callback.metadata?.method !== HMSSignalMethod.PING) {
        HMSLogger.e(this.TAG, `rejecting pending callback ${callback.metadata?.method}, id=${id}`);
        callback.reject(
          ErrorFactory.WebSocketConnectionErrors.WebSocketConnectionLost(
            callback.metadata?.method
              ? convertSignalMethodtoErrorAction(callback.metadata?.method)
              : HMSAction.RECONNECT_SIGNAL,
            reason,
          ),
        );
        this.callbacks.delete(id);
      }
    });
  }

  private async pingPongLoop(id: number) {
    const pingTimeout = window.HMS?.PING_TIMEOUT || DEFAULT_SIGNAL_PING_TIMEOUT;
    if (this.isConnected) {
      const pongTimeDiff = await this.ping(pingTimeout);
      this.pongResponseTimes.enqueue(pongTimeDiff);
      if (pongTimeDiff > pingTimeout) {
        HMSLogger.d(this.TAG, `Pong timeout ${id}, pageHidden=${isPageHidden()}`);
        if (this.id === id) {
          this.setIsConnected(false, 'ping pong failure');
        }
      } else {
        setTimeout(() => this.pingPongLoop(id), window.HMS?.PING_INTERVAL || DEFAULT_SIGNAL_PING_INTERVAL);
      }
    }
  }

  private async call<T>(method: HMSSignalMethod, params: Record<string, any>): Promise<T> {
    const MAX_RETRIES = 3;
    let error: HMSException = ErrorFactory.WebsocketMethodErrors.ServerErrors(500, method, `Default ${method} error`);
    this.validateConnection();
    let retry;
    for (retry = 1; retry <= MAX_RETRIES; retry++) {
      try {
        HMSLogger.d(this.TAG, `Try number ${retry} sending ${method}`, params);
        return await this.internalCall(method, params);
      } catch (err) {
        error = err as HMSException;
        HMSLogger.e(this.TAG, `Failed sending ${method} try: ${retry}`, { method, params, error });
        const shouldRetry = parseInt(`${error.code / 100}`) === 5 || error.code === 429;
        if (!shouldRetry) {
          break;
        }

        const delay = (2 + Math.random() * 2) * 1000;
        await workerSleep(delay);
      }
    }
    HMSLogger.e(`Sending ${method} over WS failed after ${Math.min(retry, MAX_RETRIES)} retries`, {
      method,
      params,
      error,
    });
    throw error;
  }

  private offlineListener = () => {
    HMSLogger.d(this.TAG, 'Window network offline');
    this.setIsConnected(false, 'Window network offline');
  };

  private onlineListener = () => {
    HMSLogger.d(this.TAG, 'Window network online');
    this.observer.onNetworkOnline();
  };
}
