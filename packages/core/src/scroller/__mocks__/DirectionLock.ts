import EventEmitter from '@bsas/core/src/base/EventEmitter';

const DirectionLock = jest.fn().mockImplementation((content, bscrollOptions) => {
  return {
    directionLocked: '',
    directionLockThreshold: '5',
    eventPassthrough: '',
    freeScroll: false
  };
});

export default DirectionLock;
