import { preventDefaultExceptionFn, TouchEvent, getNow, EventEmitter, Probe } from '@bsas/shared-utils';

import ActionsHandler from '../base/ActionsHandler';
import Behavior from './Behavior';
import DirectionLockAction from './DirectionLock';
import { Animater } from '../animater';
import { Options as BScrollOptions } from '../Options';
import { TranslaterPoint } from '../translater';

export default class ScrollerActions {
  hooks: EventEmitter;
  scrollBehaviorX: Behavior;
  scrollBehaviorY: Behavior;
  actionsHandler: ActionsHandler;
  animater: Animater;
  options: BScrollOptions;
  directionLockAction: DirectionLockAction;
  moved: boolean;
  enabled: boolean;
  startTime: number;
  endTime: number;
  constructor(
    scrollBehaviorX: Behavior,
    scrollBehaviorY: Behavior,
    actionsHandler: ActionsHandler,
    animater: Animater,
    options: BScrollOptions
  ) {
    this.hooks = new EventEmitter(['start', 'beforeMove', 'scrollStart', 'scroll', 'beforeEnd', 'end', 'scrollEnd']);

    this.scrollBehaviorX = scrollBehaviorX;
    this.scrollBehaviorY = scrollBehaviorY;
    this.actionsHandler = actionsHandler;
    this.animater = animater;
    this.options = options;

    this.directionLockAction = new DirectionLockAction(options.directionLockThreshold, options.freeScroll, options.eventPassthrough);

    this.enabled = true;

    this.bindActionsHandler();
  }

  private bindActionsHandler() {
    // [mouse|touch] start event
    this.actionsHandler.hooks.on(this.actionsHandler.hooks.eventTypes.start, (e: TouchEvent) => {
      if (!this.enabled) return true;
      return this.handleStart(e);
    });

    // [mouse|touch] move event
    this.actionsHandler.hooks.on(
      this.actionsHandler.hooks.eventTypes.move,
      ({ deltaX, deltaY, e }: { deltaX: number; deltaY: number; e: TouchEvent }) => {
        if (!this.enabled) return true;
        return this.handleMove(deltaX, deltaY, e);
      }
    );

    // [mouse|touch] end evnet
    this.actionsHandler.hooks.on(this.actionsHandler.hooks.eventTypes.end, (e: TouchEvent) => {
      if (!this.enabled) return true;
      return this.handleEnd(e);
    });

    // click
    this.actionsHandler.hooks.on(this.actionsHandler.hooks.eventTypes.click, (e: TouchEvent) => {
      // handle native click event
      if (this.enabled && !e._constructed) {
        this.handleClick(e);
      }
    });
  }

  private handleStart(e: TouchEvent) {
    const timestamp = getNow();
    this.moved = false;

    this.startTime = timestamp;

    this.directionLockAction.reset();

    this.scrollBehaviorX.start();
    this.scrollBehaviorY.start();

    // 强制停止上一次的 animation 或者 transition 动画
    this.animater.stop();

    this.scrollBehaviorX.resetStartPos();
    this.scrollBehaviorY.resetStartPos();

    this.hooks.trigger(this.hooks.eventTypes.start, e);
  }

  private handleMove(deltaX: number, deltaY: number, e: TouchEvent) {
    if (this.hooks.trigger(this.hooks.eventTypes.beforeMove, e)) {
      return;
    }

    const absDistX = this.scrollBehaviorX.getAbsDist(deltaX);
    const absDistY = this.scrollBehaviorY.getAbsDist(deltaY);
    const timestamp = getNow();

    // 在滚动初始化时我们至少要移动动量极限距离的像素
    if (this.checkMomentum(absDistX, absDistY, timestamp)) {
      return true;
    }
    if (this.directionLockAction.checkMovingDirection(absDistX, absDistY, e)) {
      this.actionsHandler.setInitiated();
      return true;
    }

    const delta = this.directionLockAction.adjustDelta(deltaX, deltaY);

    const newX = this.scrollBehaviorX.move(delta.deltaX);
    const newY = this.scrollBehaviorY.move(delta.deltaY);

    if (!this.moved) {
      this.moved = true;
      this.hooks.trigger(this.hooks.eventTypes.scrollStart);
    }

    this.animater.translate({
      x: newX,
      y: newY
    });

    this.dispatchScroll(timestamp);
  }

  private dispatchScroll(timestamp: number) {
    // 在间隔期间派发 scroll 事件
    if (timestamp - this.startTime > this.options.momentumLimitTime) {
      // 更新时间同时更新起始位置
      this.startTime = timestamp;
      this.scrollBehaviorX.updateStartPos();
      this.scrollBehaviorY.updateStartPos();
      if (this.options.probeType === Probe.Throttle) {
        this.hooks.trigger(this.hooks.eventTypes.scroll, this.getCurrentPos());
      }
    }

    // 不间断的派发 scroll 事件
    if (this.options.probeType > Probe.Throttle) {
      this.hooks.trigger(this.hooks.eventTypes.scroll, this.getCurrentPos());
    }
  }

  private checkMomentum(absDistX: number, absDistY: number, timestamp: number) {
    return (
      timestamp - this.endTime > this.options.momentumLimitTime &&
      absDistY < this.options.momentumLimitDistance &&
      absDistX < this.options.momentumLimitDistance
    );
  }

  private handleEnd(e: TouchEvent) {
    if (this.hooks.trigger(this.hooks.eventTypes.beforeEnd, e)) {
      return;
    }
    const currentPos = this.getCurrentPos();

    this.scrollBehaviorX.updateDirection();
    this.scrollBehaviorY.updateDirection();
    if (this.hooks.trigger(this.hooks.eventTypes.end, e, currentPos)) {
      return true;
    }

    this.animater.translate(currentPos);

    this.endTime = getNow();

    const duration = this.endTime - this.startTime;

    this.hooks.trigger(this.hooks.eventTypes.scrollEnd, currentPos, duration);
  }

  private handleClick(e: TouchEvent) {
    if (!preventDefaultExceptionFn(e.target, this.options.preventDefaultException)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  getCurrentPos(): TranslaterPoint {
    return {
      x: this.scrollBehaviorX.getCurrentPos(),
      y: this.scrollBehaviorY.getCurrentPos()
    };
  }

  refresh() {
    this.endTime = 0;
  }

  destroy() {
    this.hooks.destroy();
  }
}
