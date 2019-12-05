import { getNow, requestAnimationFrame, cancelAnimationFrame, EaseFn } from '@bsas/shared-utils';

import Base from './Base';
import { TranslaterPoint } from '../translater';
import { Probe } from '../enums/probe';

export default class Animation extends Base {
  move(startPoint: TranslaterPoint, endPoint: TranslaterPoint, time: number, easingFn: EaseFn | string, isSlient?: boolean) {
    if (!time) {
      this.translate(endPoint);
      /**
       * 如果我们短时间内改变 content 的 transformY 的属性的时候
       * 例如： 0 -> 50px -> 0
       * transitionend 不会触发
       * 所以我们需要通过重排强制更新
       */
      this._reflow = this.content.offsetHeight;
      // 如果设置 slient 时， 我们不需要触发 move 和 end 事件
      if (isSlient) return;

      this.hooks.trigger(this.hooks.eventTypes.move, endPoint);
      this.hooks.trigger(this.hooks.eventTypes.end, endPoint);
      return;
    }

    this.animate(startPoint, endPoint, time, easingFn as EaseFn);
  }

  private animate(startPoint: TranslaterPoint, endPoint: TranslaterPoint, duration: number, easingFn: EaseFn) {
    const startTime = getNow();
    const destTime = startTime + duration;

    const step = () => {
      let now = getNow();

      // js 动画结束
      if (now >= destTime) {
        this.translate(endPoint);

        this.hooks.trigger(this.hooks.eventTypes.move, endPoint);
        this.hooks.trigger(this.hooks.eventTypes.end, endPoint);
        return;
      }

      now = (now - startTime) / duration;
      const easing = easingFn(now);
      const newPoint = {} as { [key: string]: any };
      Object.keys(endPoint).forEach(key => {
        const startValue = startPoint[key];
        const endValue = endPoint[key];
        newPoint[key] = (endValue - startValue) * easing + startValue;
      });
      this.translate(<TranslaterPoint>newPoint);

      if (this.pending) {
        this.timer = requestAnimationFrame(step);
      }

      if (this.options.probeType === Probe.Realtime) {
        this.hooks.trigger(this.hooks.eventTypes.move, newPoint);
      }
    };

    this.setPending(true);
    cancelAnimationFrame(this.timer);
    step();
  }

  stop() {
    if (this.pending) {
      this.setPending(false);
      cancelAnimationFrame(this.timer);
      const pos = this.translater.getComputedPosition();
      this.setForceStopped(true);

      if (this.hooks.trigger(this.hooks.eventTypes.beforeForceStop, pos)) {
        return;
      }

      this.hooks.trigger(this.hooks.eventTypes.forceStop, pos);
    }
  }
}
