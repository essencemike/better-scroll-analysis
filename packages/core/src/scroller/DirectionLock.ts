import { TouchEvent, DirectionLock, EventPassthrough } from '@bsas/shared-utils';

enum Passthrough {
  Yes = 'yes',
  No = 'no'
}

interface DirectionMap {
  [key: string]: {
    [key: string]: EventPassthrough;
  };
}

const PassthroughHandlers = {
  [Passthrough.Yes]: (e: TouchEvent) => {
    return true;
  },
  [Passthrough.No]: (e: TouchEvent) => {
    e.preventDefault();
    return false;
  }
};

const DirectionMap: DirectionMap = {
  [DirectionLock.Horizontal]: {
    [Passthrough.Yes]: EventPassthrough.Horizontal,
    [Passthrough.No]: EventPassthrough.Vertical
  },
  [DirectionLock.Vertical]: {
    [Passthrough.Yes]: EventPassthrough.Vertical,
    [Passthrough.No]: EventPassthrough.Horizontal
  }
};

export default class DirectionLockAction {
  directionLocked: DirectionLock;
  constructor(public directionLockThreshold: number, public freeScroll: boolean, public eventPassthrough: string) {
    this.reset();
  }

  reset() {
    this.directionLocked = DirectionLock.Default;
  }

  checkMovingDirection(absDistX: number, absDistY: number, e: TouchEvent) {
    this.computeDirectionLock(absDistX, absDistY);

    return this.handleEventPassthrough(e);
  }

  adjustDelta(deltaX: number, deltaY: number) {
    if (this.directionLocked === DirectionLock.Horizontal) {
      deltaY = 0;
    } else if (this.directionLocked === DirectionLock.Vertical) {
      deltaX = 0;
    }

    return {
      deltaX,
      deltaY
    };
  }

  private computeDirectionLock(absDistX: number, absDistY: number) {
    // 如果你向一个方向滚动请锁定他
    if (this.directionLocked === DirectionLock.Default && !this.freeScroll) {
      if (absDistX > absDistY + this.directionLockThreshold) {
        this.directionLocked = DirectionLock.Horizontal; // 横向滚动锁定
      } else if (absDistY >= absDistX + this.directionLockThreshold) {
        this.directionLocked = DirectionLock.Vertical; // 纵向滚动锁定
      } else {
        this.directionLocked = DirectionLock.None; // 没有锁定
      }
    }
  }

  private handleEventPassthrough(e: TouchEvent) {
    const handleMap = DirectionMap[this.directionLocked];

    if (handleMap) {
      if (this.eventPassthrough === handleMap[Passthrough.Yes]) {
        return PassthroughHandlers[Passthrough.Yes](e);
        // tslint:disable-next-line: no-else-after-return
      } else if (this.eventPassthrough === handleMap[Passthrough.No]) {
        return PassthroughHandlers[Passthrough.No](e);
      }
    }

    return false;
  }
}
