import { EventTargetPolyfill, getEventTarget } from '../../core/hmsSDKStore/EventTargetPolyfill';

let eventTarget: EventTargetPolyfill;

beforeEach(() => {
  eventTarget = new EventTargetPolyfill();
});

describe('test event target polyfill', () => {
  test('without event listeners, dispatch should return true', () => {
    const value = eventTarget.dispatchEvent(new Event('test'));
    expect(value).toBe(true);
  });

  test('remove without event listeners should return undefined', () => {
    const mockCallback1 = jest.fn();

    const value = eventTarget.removeEventListener('test', mockCallback1);
    expect(value).toBe(undefined);
  });

  test('with event listeners, all listeners to be called', () => {
    const mockCallback1 = jest.fn(val => val);
    const mockCallback2 = jest.fn(val => val);
    const event = new Event('test');

    eventTarget.addEventListener('test', mockCallback1);
    eventTarget.addEventListener('test', mockCallback2);
    eventTarget.dispatchEvent(event);
    expect(mockCallback1.mock.calls.length).toBe(1);
    expect(mockCallback2.mock.calls.length).toBe(1);

    expect(mockCallback1.mock.results[0].value).toBe(event);
    expect(mockCallback2.mock.results[0].value).toBe(event);
  });

  test('adding and removing listeners, listener count should match', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();

    eventTarget.addEventListener('test', mockCallback1);
    eventTarget.addEventListener('test', mockCallback2);
    eventTarget.dispatchEvent(new Event('test'));
    eventTarget.removeEventListener('test', mockCallback2);
    eventTarget.dispatchEvent(new Event('test'));
    expect(mockCallback1.mock.calls.length).toBe(2);
    expect(mockCallback2.mock.calls.length).toBe(1);
  });

  test('check if getEventTarget return EventTarget or Polyfill', () => {
    const ref = EventTarget.constructor;
    let polyfilled;

    //@ts-ignore
    EventTarget.constructor = undefined;
    polyfilled = getEventTarget();
    expect(polyfilled).toBe(EventTargetPolyfill);

    EventTarget.constructor = ref;
    polyfilled = getEventTarget();
    expect(polyfilled).toBe(EventTarget);
  });
});
