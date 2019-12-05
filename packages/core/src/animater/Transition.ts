import { style, requestAnimationFrame, cancelAnimationFrame, EaseFn } from '@bsas/shared-utils';

import Base from './Base';
import { TranslaterPoint } from '../translater';
import { Probe } from '../enums/probe';

export default class Transition extends Base {
  startProbe() {
    const probe = () => {
      const pos = this.translater.getComputedPosition();
      this.hooks.trigger(this.hooks.eventTypes.move, pos);

      // 处理 transition 动画结束
      if (!this.pending) {
        this.hooks.trigger(this.hooks.eventTypes.end, pos);
        return;
      }
      this.timer = requestAnimationFrame(probe);
    };

    cancelAnimationFrame(this.timer);
    this.timer = requestAnimationFrame(probe);
  }

  transitionTime(time = 0) {
    this.style[style.transitionDuration] = `${time}ms`;
    this.hooks.trigger(this.hooks.eventTypes.time, time);
  }

  transitionTimingFunction(easing: string) {
    this.style[style.transitionTimingFunction] = easing;
    this.hooks.trigger(this.hooks.eventTypes.timeFunction, easing);
  }

  move(startPoint: TranslaterPoint, endPoint: TranslaterPoint, time: number, easingFn: string | EaseFn, isSlient?: boolean) {
    this.setPending(time > 0 && (startPoint.x !== endPoint.x || startPoint.y !== endPoint.y));
    this.transitionTimingFunction(easingFn as string);
    this.transitionTime(time);
    this.translate(endPoint);

    if (time && this.options.probeType === Probe.Realtime) {
      this.startProbe();
    }

    if (!time) {
      this._reflow = this.content.offsetHeight;
    }

    if (!time && !isSlient) {
      this.hooks.trigger(this.hooks.eventTypes.move, endPoint);
      this.hooks.trigger(this.hooks.eventTypes.end, endPoint);
    }
  }

  stop() {
    if (this.pending) {
      this.setPending(false);
      cancelAnimationFrame(this.timer);
      const pos = this.translater.getComputedPosition();
      this.transitionTime();
      this.translate(pos);
      this.setForceStopped(true);

      if (this.hooks.trigger(this.hooks.eventTypes.beforeForceStop, pos)) {
        return;
      }

      this.hooks.trigger(this.hooks.eventTypes.forceStop, pos);
    }
  }
}
