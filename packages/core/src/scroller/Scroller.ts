import {
  getElement,
  ease,
  offset,
  style,
  preventDefaultExceptionFn,
  TouchEvent,
  isAndroid,
  click,
  dblclick,
  tap,
  isUndef,
  getNow,
  cancelAnimationFrame,
  EaseItem
} from '@bsas/shared-utils';

import ActionsHandler from '../base/ActionsHandler';
import EventEmitter from '../base/EventEmitter';
import EventRegister from '../base/EventRegister';
import Translater, { TranslaterPoint } from '../translater';
import createAnimater, { Animater, Transition } from '../animater';
import { Options as BScrollOptions, BounceConfig } from '../Options';
import Behavior from './Behavior';
import ScrollerActions from './Actions';
import { createActionsHandlerOptions, createBehaviorOptions } from './createOptions';
import { Probe } from '../enums';
import { bubbling } from '../utils/bubbling';

export default class Scroller {
  wrapper: HTMLElement;
  content: HTMLElement;
  actionsHandler: ActionsHandler;
  translater: Translater;
  animater: Animater;
  scrollBehaviorX: Behavior;
  scrollBehaviorY: Behavior;
  actions: ScrollerActions;
  hooks: EventEmitter;
  resizeRegister: EventRegister;
  transitionEndRegister: EventRegister;
  options: BScrollOptions;
  wrapperOffset: {
    left: number;
    top: number;
  };
  resizeTimeout: number;
  lastClickTime: number | null;
  [key: string]: any;
  constructor(wrapper: HTMLElement, options: BScrollOptions) {
    this.hooks = new EventEmitter([
      'beforeStart',
      'beforeMove',
      'beforeScrollStart',
      'scrollStart',
      'scroll',
      'beforeEnd',
      'scrollEnd',
      'refresh',
      'touchEnd',
      'end',
      'flick',
      'scrollCancel',
      'momentum',
      'scrollTo',
      'ignoreDisMoveForSamePos',
      'scrollToElement'
    ]);
    this.wrapper = wrapper;
    this.content = wrapper.children[0] as HTMLElement;
    this.options = options;

    const { left = true, right = true, top = true, bottom = true } = this.options.bounce as BounceConfig;

    this.scrollBehaviorX = new Behavior(
      wrapper,
      createBehaviorOptions(options, 'scrollX', [left, right], {
        size: 'width',
        position: 'left'
      })
    );

    this.scrollBehaviorY = new Behavior(
      wrapper,
      createBehaviorOptions(options, 'scrollY', [top, bottom], {
        size: 'height',
        position: 'top'
      })
    );

    this.translater = new Translater(this.content);

    this.animater = createAnimater(this.content, this.translater, this.options);

    this.actionsHandler = new ActionsHandler(wrapper, createActionsHandlerOptions(this.options));

    this.actions = new ScrollerActions(this.scrollBehaviorX, this.scrollBehaviorY, this.actionsHandler, this.animater, this.options);

    const resizeHandler = this.resize.bind(this);
    this.resizeRegister = new EventRegister(window, [
      {
        name: 'orientationchange',
        handler: resizeHandler
      },
      {
        name: 'resize',
        handler: resizeHandler
      }
    ]);

    this.transitionEndRegister = new EventRegister(this.content, [
      {
        name: style.transitionEnd,
        handler: this.transitionEnd.bind(this)
      }
    ]);

    this.init();
  }

  private init() {
    this.bindTranslater();
    this.bindAnimater();
    this.bindActions();
    //  滚动结束时启用指针事件
    this.hooks.on(this.hooks.eventTypes.scrollEnd, () => {
      this.togglePointerEvents(true);
    });
  }

  private bindTranslater() {
    const { hooks } = this.translater;
    hooks.on(hooks.eventTypes.beforeTranslate, (transformStyle: string[]) => {
      if (this.options.translateZ) {
        transformStyle.push(this.options.translateZ);
      }
    });

    // 滚动时禁用指针事件
    hooks.on(hooks.eventTypes.translate, (pos: TranslaterPoint) => {
      this.updatePositions(pos);
      this.togglePointerEvents(false);
    });
  }

  private bindAnimater() {
    this.animater.hooks.on(this.animater.hooks.eventTypes.end, (pos: TranslaterPoint) => {
      if (!this.resetPosition(this.options.bounceTime)) {
        this.animater.setPending(false);
        this.hooks.trigger(this.hooks.eventTypes.scrollEnd, pos);
      }
    });

    bubbling(this.animater.hooks, this.hooks, [
      {
        source: this.animater.hooks.eventTypes.move,
        target: this.hooks.eventTypes.scroll
      },
      {
        source: this.animater.hooks.eventTypes.forceStop,
        target: this.hooks.eventTypes.scrollEnd
      }
    ]);
  }

  private bindActions() {
    const actions = this.actions;

    bubbling(actions.hooks, this.hooks, [
      {
        source: actions.hooks.eventTypes.start,
        target: this.hooks.eventTypes.beforeStart
      },
      {
        source: actions.hooks.eventTypes.start,
        target: this.hooks.eventTypes.beforeScrollStart
      },
      {
        source: actions.hooks.eventTypes.beforeMove,
        target: this.hooks.eventTypes.beforeMove
      },
      {
        source: actions.hooks.eventTypes.scrollStart,
        target: this.hooks.eventTypes.scrollStart
      },
      {
        source: actions.hooks.eventTypes.scroll,
        target: this.hooks.eventTypes.scroll
      },
      {
        source: actions.hooks.eventTypes.beforeEnd,
        target: this.hooks.eventTypes.beforeEnd
      }
    ]);

    actions.hooks.on(actions.hooks.eventTypes.end, (e: TouchEvent, pos: TranslaterPoint) => {
      this.hooks.trigger(this.hooks.eventTypes.touchEnd, pos);

      if (this.hooks.trigger(this.hooks.eventTypes.end, pos)) {
        return true;
      }

      // 检查是否是一个点击操作
      if (!actions.moved && this.checkClick(e)) {
        this.animater.setForceStopped(false);
        this.hooks.trigger(this.hooks.eventTypes.scrollCancel);
        return true;
      }
      this.animater.setForceStopped(false);

      // 如果我们超过了边界就重置位置
      if (this.resetPosition(this.options.bounceTime, ease.bounce)) {
        return true;
      }
    });

    actions.hooks.on(actions.hooks.eventTypes.scrollEnd, (pos: TranslaterPoint, duration: number) => {
      const deltaX = Math.abs(pos.x - this.scrollBehaviorX.startPos);
      const deltaY = Math.abs(pos.y - this.scrollBehaviorY.startPos);

      if (this.checkFlick(duration, deltaX, deltaY)) {
        this.hooks.trigger(this.hooks.eventTypes.flick);
        return;
      }

      if (this.momentum(pos, duration)) {
        return;
      }

      this.hooks.trigger(this.hooks.eventTypes.scrollEnd, pos);
    });
  }

  private checkFlick(duration: number, deltaX: number, deltaY: number) {
    if (
      this.hooks.events.flick.length > 1 &&
      duration < this.options.flickLimitTime &&
      deltaX < this.options.flickLimitDistance &&
      deltaY < this.options.flickLimitDistance
    ) {
      return true;
    }
  }

  private momentum(pos: TranslaterPoint, duration: number) {
    const meta = {
      time: 0,
      easing: ease.swiper,
      newX: pos.x,
      newY: pos.y
    };

    const momentumX = this.scrollBehaviorX.end(duration);
    const momentumY = this.scrollBehaviorY.end(duration);

    meta.newX = isUndef(momentumX.destination) ? meta.newX : (momentumX.destination as number);
    meta.newY = isUndef(momentumY.destination) ? meta.newY : (momentumY.destination as number);
    meta.time = Math.max(momentumX.duration as number, momentumY.duration as number);

    this.hooks.trigger(this.hooks.eventTypes.momentum, meta, this);
    // 如果 x 或者 y 发生了变化， 立即执行动量动画
    if (meta.newX !== pos.x || meta.newY !== pos.y) {
      // 滚动条超出边界时更改缓动函数
      if (
        meta.newX > this.scrollBehaviorX.minScrollPos ||
        meta.newX < this.scrollBehaviorX.maxScrollPos ||
        meta.newY > this.scrollBehaviorY.minScrollPos ||
        meta.newY < this.scrollBehaviorY.maxScrollPos
      ) {
        meta.easing = ease.swipeBounce;
      }
      this.scrollTo(meta.newX, meta.newY, meta.time, meta.easing);
      return true;
    }
  }

  private checkClick(e: TouchEvent) {
    // 在下拉过程中， 不应该阻止 click
    const cancelable = {
      preventClick: this.animater.forceStopped
    };

    if (this.hooks.trigger(this.hooks.eventTypes.checkClick)) return true;
    if (!cancelable.preventClick) {
      const _dblclick = this.options.dblclick;
      let dblclickTrigged = false;
      if (_dblclick && this.lastClickTime) {
        const { delay = 300 } = _dblclick as any;
        if (getNow() - this.lastClickTime < delay) {
          dblclickTrigged = true;
          dblclick(e);
        }
      }
      if (this.options.tap) {
        tap(e, this.options.tap);
      }
      if (this.options.click && !preventDefaultExceptionFn(e.target, this.options.preventDefaultException)) {
        click(e);
      }

      this.lastClickTime = dblclickTrigged ? null : getNow();
      return true;
    }
    return false;
  }

  private resize() {
    if (!this.actions.enabled) {
      return;
    }
    // fix a scroll problem under Android condition
    if (isAndroid) {
      this.wrapper.scrollTop = 0;
    }
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = window.setTimeout(() => {
      this.refresh();
    }, this.options.resizePolling);
  }

  private transitionEnd(e: TouchEvent) {
    if (e.target !== this.content || !this.animater.pending) {
      return;
    }
    const animater = this.animater as Transition;
    animater.transitionTime();

    if (!this.resetPosition(this.options.bounceTime, ease.bounce)) {
      this.animater.setPending(false);
      if (this.options.probeType !== Probe.Realtime) {
        this.hooks.trigger(this.hooks.eventTypes.scrollEnd, this.getCurrentPos());
      }
    }
  }

  private togglePointerEvents(enabled = true) {
    const el = this.content.children.length ? this.content.children : [this.content];
    const pointerEvents = enabled ? 'auto' : 'none';
    for (let i = 0; i < el.length; i++) {
      const node = el[i] as HTMLElement;
      // 忽略 BetterScroll 包裹的实例
      if ((node as any).isBScroll) {
        continue;
      }
      node.style.pointerEvents = pointerEvents;
    }
  }

  refresh() {
    this.scrollBehaviorX.refresh();
    this.scrollBehaviorY.refresh();

    this.actions.refresh();
    this.wrapperOffset = offset(this.wrapper);
  }

  scrollBy(deltaX: number, deltaY: number, time = 0, easing?: EaseItem) {
    const { x, y } = this.getCurrentPos();
    easing = !easing ? ease.bounce : easing;
    deltaX += x;
    deltaY += y;

    this.scrollTo(deltaX, deltaY, time, easing);
  }

  scrollTo(
    x: number,
    y: number,
    time = 0,
    easing?: EaseItem,
    extraTransform = {
      start: {},
      end: {}
    },
    isSilent?: boolean
  ) {
    easing = !easing ? ease.bounce : easing;
    const easingFn = this.options.useTransition ? easing.style : easing.fn;
    const currentPos = this.getCurrentPos();

    const startPoint = {
      x: currentPos.x,
      y: currentPos.y,
      ...extraTransform.start
    };
    const endPoint = {
      x,
      y,
      ...extraTransform.end
    };

    this.hooks.trigger(this.hooks.eventTypes.scrollTo, endPoint);
    if (!this.hooks.trigger(this.hooks.eventTypes.ignoreDisMoveForSamePos)) {
      if (startPoint.x === endPoint.x && startPoint.y === endPoint.y) {
        return;
      }
    }
    this.animater.move(startPoint, endPoint, time, easingFn, isSilent);
  }

  scrollToElement(el: HTMLElement | string, time: number, offsetX: number | boolean, offsetY: number | boolean, easing?: EaseItem) {
    const targetEl = getElement(el);
    const pos = offset(targetEl);

    const getOffset = (offset: number | boolean, size: number, wrapperSize: number) => {
      if (typeof offset === 'number') {
        return offset;
      }

      return offset ? Math.round(size / 2 - wrapperSize / 2) : 0;
    };
    offsetX = getOffset(offsetX, targetEl.offsetWidth, this.wrapper.offsetWidth);
    offsetY = getOffset(offsetY, targetEl.offsetHeight, this.wrapper.offsetHeight);

    const getPos = (pos: number, wrapperPos: number, offset: number, scrollBehavior: Behavior) => {
      pos -= wrapperPos;
      pos = scrollBehavior.adjustPosition(pos - offset);
      return pos;
    };

    pos.left = getPos(pos.left, this.wrapperOffset.left, offsetX, this.scrollBehaviorX);
    pos.top = getPos(pos.top, this.wrapperOffset.top, offsetY, this.scrollBehaviorY);

    if (this.hooks.trigger(this.hooks.eventTypes.scrollToElement, targetEl, pos)) {
      return;
    }

    this.scrollTo(pos.left, pos.top, time, easing);
  }

  resetPosition(time = 0, easing?: EaseItem) {
    easing = !easing ? ease.bounce : easing;
    const { position: x, inBoundary: xInBoundary } = this.scrollBehaviorX.checkInBoundary();
    const { position: y, inBoundary: yInBoundary } = this.scrollBehaviorY.checkInBoundary();

    if (xInBoundary && yInBoundary) {
      return false;
    }

    this.scrollTo(x, y, time, easing);

    return true;
  }

  updatePositions(pos: TranslaterPoint) {
    this.scrollBehaviorX.updatePosition(pos.x);
    this.scrollBehaviorY.updatePosition(pos.y);
  }

  getCurrentPos() {
    return this.actions.getCurrentPos();
  }

  enable() {
    this.actions.enabled = true;
  }

  disable() {
    cancelAnimationFrame(this.animater.timer);
    this.actions.enabled = false;
  }

  destroy(this: Scroller) {
    const keys = [
      'resizeRegister',
      'transitionEndRegister',
      'actionsHandler',
      'actions',
      'hooks',
      'animater',
      'translater',
      'scrollBehaviorX',
      'scrollBehaviorY'
    ];
    keys.forEach(key => this[key].destroy());
  }
}
