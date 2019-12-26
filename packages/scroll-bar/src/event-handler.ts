import BScroll from '@bsas/core';
import { TouchEvent, EventRegister, EventEmitter } from '@bsas/shared-utils';
import Indicator from './indicator';

interface EventHandlerOptions {
  disableMouse: boolean | '';
}

export default class EventHandler {
  public startEventRegister: EventRegister;
  public moveEventRegister: EventRegister;
  public endEventRegister: EventRegister;
  public initiated: boolean;
  public moved: boolean;
  private lastPoint: number;
  public bscroll: BScroll;
  public hooks: EventEmitter;

  constructor(public indicator: Indicator, public options: EventHandlerOptions) {
    this.bscroll = indicator.bscroll;
    this.startEventRegister = new EventRegister(this.indicator.el, [
      {
        name: options.disableMouse ? 'touchstart' : 'mousedown',
        handler: this.start.bind(this)
      }
    ]);

    this.endEventRegister = new EventRegister(window, [
      {
        name: options.disableMouse ? 'touchend' : 'mouseup',
        handler: this.end.bind(this)
      }
    ]);

    this.hooks = new EventEmitter(['touchStart', 'touchMove', 'touchEnd']);
  }

  private start(e: TouchEvent) {
    const point = (e.touches ? e.touches[0] : e) as Touch;

    e.preventDefault();
    e.stopPropagation();

    this.initiated = true;
    this.moved = false;
    this.lastPoint = point[this.indicator.keysMap.pointPos];

    const { disableMouse } = this.bscroll.options;
    this.moveEventRegister = new EventRegister(window, [
      {
        name: disableMouse ? 'touchmove' : 'mousemove',
        handler: this.move.bind(this)
      }
    ]);
    this.hooks.trigger('touchStart');
  }

  private move(e: TouchEvent) {
    const point = (e.touches ? e.touches[0] : e) as Touch;
    const pointPos = point[this.indicator.keysMap.pointPos];

    e.preventDefault();
    e.stopPropagation();

    const delta = pointPos - this.lastPoint;
    this.lastPoint = pointPos;

    if (!this.moved) {
      this.hooks.trigger('touchMove', this.moved, delta);
      this.moved = true;
      return;
    }

    this.hooks.trigger('touchMove', this.moved, delta);
  }

  private end(e: TouchEvent) {
    if (!this.initiated) {
      return;
    }
    this.initiated = false;

    e.preventDefault();
    e.stopPropagation();

    this.moveEventRegister.destroy();
    this.hooks.trigger('touchEnd', this.moved);
  }

  public destroy() {
    this.startEventRegister.destroy();
    this.moveEventRegister && this.moveEventRegister.destroy();
    this.endEventRegister.destroy();
  }
}
