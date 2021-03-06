import { EventEmitter } from '@bsas/shared-utils';

const Behavior = jest.fn().mockImplementation((content, bscrollOptions) => {
  return {
    content,
    options: bscrollOptions,
    startPos: 0,
    absStartPos: 0,
    dist: 0,
    minScrollPos: 0,
    maxScrollPos: 0,
    hasScroll: true,
    direction: 0,
    movingDirection: 0,
    relativeOffset: 0,
    wrapperSize: 0,
    contentSize: 0,
    hooks: new EventEmitter(['momentum', 'end']),
    start: jest.fn(),
    move: jest.fn(),
    end: jest.fn(),
    updateDirection: jest.fn(),
    refresh: jest.fn(),
    updatePosition: jest.fn(),
    getCurrentPos: jest.fn(),
    checkInBoundary: jest.fn(),
    adjustPosition: jest.fn(),
    updateStartPos: jest.fn(),
    updateAbsStartPos: jest.fn(),
    resetStartPos: jest.fn(),
    getAbsDist: jest.fn(),
    destroy: jest.fn()
  };
});

export default Behavior;
