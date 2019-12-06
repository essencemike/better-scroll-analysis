import DirectionLock from '@bsas/core/src/scroller/DirectionLock';

jest.mock('@bsas/core/src/scroller/DirectionLock');

import EventEmitter from '@bsas/core/src/base/EventEmitter';

const ScrollerActions = jest.fn().mockImplementation((scrollBehaviorX, scrollBehaviorY, actionsHandler, animater, bscrollOptions) => {
  const directionLockAction = new DirectionLock(0, false, '');

  return {
    scrollBehaviorX,
    scrollBehaviorY,
    actionsHandler,
    animater,
    directionLockAction,
    options: bscrollOptions,
    moved: false,
    enabled: true,
    startTime: 0,
    endTime: 0,
    getCurrentPos: jest.fn(),
    refresh: jest.fn(),
    destroy: jest.fn(),
    hooks: new EventEmitter(['start', 'beforeMove', 'scrollStart', 'scroll', 'beforeEnd', 'end', 'scrollEnd'])
  };
});

export default ScrollerActions;
