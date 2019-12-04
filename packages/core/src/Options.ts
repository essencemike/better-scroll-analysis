import { hasTransition, hasPerspective, hasTouch } from '@bsas/shared-utils';

import { Probe, EventPassthrough } from './enums';

export type tap = 'tap' | '';
export type bounceOptions = Partial<BounceConfig> | boolean;
export type dblclickOptions = Partial<DblclickConfig> | boolean;

export interface BounceConfig {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

export interface DblclickConfig {
  delay: number;
}

export class Options {
  [key: string]: any;
  startX: number;
  startY: number;
  scrollX: boolean;
  scrollY: boolean;
  freeScroll: boolean;
  directionLockThreshold: number;
  eventPassthrough: string;
  click: boolean;
  tap: tap;
  bounce: bounceOptions;
  bounceTime: number;
  momentum: boolean;
  momentumLimitTime: number;
  momentumLimitDistance: number;
  swipeTime: number;
  swipeBounceTime: number;
  deceleration: number;
  flickLimitTime: number;
  flickLimitDistance: number;
  resizePolling: number;
  probeType: number;
  stopPropagation: boolean;
  preventDefault: boolean;
  preventDefaultException: {
    tagName?: RegExp;
    className?: RegExp;
  };
  tagException: {
    tagName?: RegExp;
    className?: RegExp;
  };
  HWCompositing: boolean;
  useTransition: boolean;
  bindToWrapper: boolean;
  disableMouse: boolean | '';
  disableTouch: boolean;
  autoBlur: boolean;
  translateZ: string;
  dblclick: dblclickOptions;

  constructor() {
    this.startX = 0;
    this.startY = 0;
    this.scrollX = false;
    this.scrollY = true;
    this.freeScroll = false;
    this.directionLockThreshold = 5;
    this.eventPassthrough = EventPassthrough.None;
    this.click = false;
    this.dblclick = false;
    this.tap = '';

    this.bounce = {
      top: true,
      bottom: true,
      left: true,
      right: true
    };
    this.bounceTime = 800;

    this.momentum = true;
    this.momentumLimitTime = 300;
    this.momentumLimitDistance = 15;

    this.swipeTime = 2500;
    this.swipeBounceTime = 500;

    this.deceleration = 0.0015;

    this.flickLimitTime = 200;
    this.flickLimitDistance = 100;

    this.resizePolling = 60;
    this.probeType = Probe.Default;

    this.stopPropagation = false;
    this.preventDefault = true;
    this.preventDefaultException = {
      tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|AUDIO)$/
    };
    this.tagException = {
      tagName: /^TEXTAREA$/
    };

    this.HWCompositing = true;
    this.useTransition = true;

    this.bindToWrapper = false;
    this.disableMouse = hasTouch;
    this.disableTouch = !hasTouch;
    this.autoBlur = true;
  }

  merge(options?: { [key: string]: any }) {
    if (!options) return this;

    for (const key in options) {
      this[key] = options[key];
    }

    return this;
  }

  process() {
    this.translateZ = this.HWCompositing && hasPerspective ? ' translateZ(0)' : '';

    this.useTransition = this.useTransition && hasTransition;

    this.preventDefault = !this.eventPassthrough && this.preventDefault;

    // 如果需要 eventPassthrough 的话必须锁定一个轴
    this.scrollX = this.eventPassthrough === EventPassthrough.Horizontal ? false : this.scrollX;

    this.scrollY = this.eventPassthrough === EventPassthrough.Vertical ? false : this.scrollY;

    // 如果需要 eventPassthrough 我们还需要锁定方向机制
    this.freeScroll = this.freeScroll && !this.eventPassthrough;

    this.scrollX = this.freeScroll ? true : this.scrollX;
    this.scrollY = this.freeScroll ? true : this.scrollY;

    this.directionLockThreshold = this.eventPassthrough ? 0 : this.directionLockThreshold;

    return this;
  }
}
