import { createDefaultStoreState, HMSStore, IHMSStore, selectLocalPeer, selectPeers } from '../../';
import { HMSReactiveStore } from '../../reactive-store/HMSReactiveStore';
import { localPeer, makeFakeStore } from '../fakeStore';

let store: IHMSStore;
let fakeData: HMSStore;
let cb: jest.Mock;
let initialState: HMSStore;

beforeEach(() => {
  store = HMSReactiveStore.createNewHMSStore('HMSStore', createDefaultStoreState);
  cb = jest.fn(val => val);
  fakeData = makeFakeStore();
  store.setState(store => {
    Object.assign(store, fakeData);
  });
  initialState = store.getState();
});

const expectCalls = (n: number) => {
  expect(cb.mock.calls.length).toBe(n);
};
const expectOneCall = () => {
  expectCalls(1);
};
const expectTwoCalls = () => {
  expectCalls(2);
};

const expectCallArgs = <T>(arg1: T, arg2?: T) => {
  expect(cb.mock.calls[0][0]).toBe(arg1);
  expect(cb.mock.calls[0][1]).toBe(arg2);
};
const expectCallArgs2 = <T>(arg1: T, arg2?: T) => {
  expect(cb.mock.calls[1][0]).toBe(arg1);
  expect(cb.mock.calls[1][1]).toBe(arg2);
};

const doUnrelatedChange = () => {
  store.setState(draft => {
    draft.room.isConnected = !draft.room.isConnected;
  });
};

describe('test reactive store', () => {
  const expectStoreChanged = () => {
    expect(store.getState()).not.toBe(initialState);
  };

  const expectNoCalls = () => {
    expectCalls(0);
  };

  test('getState works', () => {
    expect(store.getState()).toEqual(fakeData);
  });

  it('sends both old and new to subscriber', () => {
    store.subscribe(cb, selectLocalPeer);
    const oldPeer = store.getState(selectLocalPeer);
    store.setState(draft => {
      draft.peers[localPeer.id].name = 'test2';
    });
    const newPeer = store.getState(selectLocalPeer);
    expect(newPeer).not.toBe(oldPeer);
    expectStoreChanged();
    expectOneCall();
    expectCallArgs(newPeer, oldPeer);
  });

  it('does not notify on no changes or unrelated changes', () => {
    store.subscribe(cb, selectLocalPeer);
    const oldPeer = store.getState(selectLocalPeer);
    store.setState(draft => {
      if (oldPeer?.name) {
        draft.peers[localPeer.id].name = oldPeer.name;
      }
    });
    doUnrelatedChange();
    expectStoreChanged();
    const newPeer = store.getState(selectLocalPeer);
    expect(newPeer).toBe(oldPeer);
    expectNoCalls();
  });

  it('does not notify on unrelated changes for derived selectors', () => {
    store.subscribe(cb, selectPeers);
    doUnrelatedChange();
    expectStoreChanged();
    expectNoCalls();
  });

  it('triggers on listening to whole state without selector', () => {
    store.subscribe(cb);
    doUnrelatedChange();
    expectStoreChanged();
    expectOneCall();
  });
});

describe('store with trigger on subscribe', () => {
  beforeEach(() => {
    HMSReactiveStore.makeStoreTriggerOnSubscribe(store);
  });

  it('triggers on subscribe', () => {
    store.subscribe(cb, selectLocalPeer);
    const peer = store.getState(selectLocalPeer);
    expectOneCall();
    expectCallArgs(peer);
  });

  it('does not trigger again on unrelated change', () => {
    store.subscribe(cb, selectLocalPeer);
    const peer = store.getState(selectLocalPeer);
    doUnrelatedChange();
    expectOneCall();
    expectCallArgs(peer);
  });

  it('triggers on subscribe and a change', () => {
    store.subscribe(cb, selectLocalPeer);
    const oldPeer = store.getState(selectLocalPeer);
    store.setState(draft => {
      draft.peers[localPeer.id].name = 'test2';
    });
    const newPeer = store.getState(selectLocalPeer);
    expectTwoCalls();
    expectCallArgs(oldPeer);
    expectCallArgs2(newPeer, oldPeer);
  });
});
