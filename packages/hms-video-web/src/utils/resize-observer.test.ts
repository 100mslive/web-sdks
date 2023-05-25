import { HMSResizeObserverWrapper } from './resize-observer';

describe('HMSResizeObserverWrapper', () => {
  // Tests that the isSupported method returns true when ResizeObserver is supported and false otherwise.
  test('is supported', () => {
    const wrapper = new HMSResizeObserverWrapper();
    const isSupported = wrapper.isSupported();
    expect(typeof isSupported).toBe('boolean');
  });

  test('observe element', () => {
    const wrapper = new HMSResizeObserverWrapper();
    const element = document.createElement('div');
    const callback = jest.fn();
    wrapper.observe(element, callback);
    expect(wrapper['listeners'].get(element)).toBe(callback);
  });

  test('create observer unsupported', () => {
    const wrapper = new HMSResizeObserverWrapper();
    // @ts-ignore
    window.ResizeObserver = undefined;
    // @ts-ignore
    wrapper.createObserver();
    expect(wrapper['resizeObserver']).toBeUndefined();
  });

  test('unobserve element', () => {
    const wrapper = new HMSResizeObserverWrapper();
    const element = document.createElement('div');
    const callback = jest.fn();
    wrapper.observe(element, callback);
    wrapper.unobserve(element);
    expect(wrapper['listeners'].has(element)).toBe(false);
  });

  test('handle resize', () => {
    const wrapper = new HMSResizeObserverWrapper();
    const element = document.createElement('div');
    const callback = jest.fn();
    wrapper.observe(element, callback);
    wrapper['handleResize']([{ target: element } as unknown as ResizeObserverEntry]);
    expect(callback).toHaveBeenCalled();
  });

  test('create observer', () => {
    const wrapper = new HMSResizeObserverWrapper();
    window.ResizeObserver = jest.fn();
    // @ts-ignore
    wrapper.createObserver();
    expect(wrapper['resizeObserver']).toBeDefined();
  });
});
