import { bubbling } from '@bsas/core/src/utils/bubbling';
import EventEmitter from '@bsas/core/src/base/EventEmitter';

describe('bubbling', () => {
  it('bubbling', () => {
    const parentHooks = new EventEmitter(['test']);
    const childHooks = new EventEmitter(['test']);
    bubbling(childHooks, parentHooks, ['test']);
    const handler = jest.fn(() => {});
    parentHooks.on('test', handler);
    childHooks.trigger('test', 'dummy test');

    expect(handler).toBeCalledWith('dummy test');
  });
});
