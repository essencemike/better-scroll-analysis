import EventEmitter from '@bsas/core/src/base/EventEmitter';
import EventRegister from '@bsas/core/src/base/EventRegister';

const actionsHandler = jest.fn().mockImplementation((wrapper, bscrollOptions) => {
  return {
    wrapper,
    options: bscrollOptions,
    initiated: 1,
    pointX: 0,
    pointY: 0,
    startClickRegister: new EventRegister(wrapper, []),
    moveEndRegister: new EventRegister(wrapper, []),
    hooks: new EventEmitter(['beforeStart', 'start', 'move', 'end', 'click']),
    destroy: jest.fn()
  };
});

export default actionsHandler;
