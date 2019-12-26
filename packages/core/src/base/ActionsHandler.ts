import {
  TouchEvent,
  // dom 相关
  preventDefaultExceptionFn,
  tagExceptionFn,
  eventTypeMap,
  hasTouch,
  EventRegister,
  EventEmitter,
  EventType,
  MouseButton
} from '@bsas/shared-utils';

type Exception = {
  tagName?: RegExp;
  className?: RegExp;
};

export interface Options {
  [key: string]: boolean | number | Exception;
  click: boolean;
  bindToWrapper: boolean;
  disableMouse: boolean;
  disableTouch: boolean;
  preventDefault: boolean;
  stopPropagation: boolean;
  preventDefaultException: Exception;
  tagException: Exception;
  momentumLimitDistance: number;
}

export default class ActionsHandler {
  hooks: EventEmitter;
  initiated: number;
  pointX: number;
  pointY: number;
  wrapperEventRegister: EventRegister;
  targetEventRegister: EventRegister;
  constructor(public wrapper: HTMLElement, public options: Options) {
    this.hooks = new EventEmitter(['beforeStart', 'start', 'move', 'end', 'click']);

    this.handleDOMEvents();
  }

  private handleDOMEvents() {
    const { bindToWrapper, disableMouse, disableTouch, click } = this.options;
    const wrapper = this.wrapper;
    const target = bindToWrapper ? wrapper : window;
    const wrapperEvents = [];
    const targetEvents = [];
    const shouldRegisterTouch = hasTouch && !disableTouch;
    const shouldRegisterMouse = !disableMouse;

    if (click) {
      wrapperEvents.push({
        name: 'click',
        handler: this.click.bind(this),
        capture: true
      });
    }

    if (shouldRegisterTouch) {
      wrapperEvents.push({
        name: 'touchstart',
        handler: this.start.bind(this)
      });

      targetEvents.push(
        {
          name: 'touchmove',
          handler: this.move.bind(this)
        },
        {
          name: 'touchend',
          handler: this.end.bind(this)
        },
        {
          name: 'touchcancel',
          handler: this.end.bind(this)
        }
      );
    }

    if (shouldRegisterMouse) {
      wrapperEvents.push({
        name: 'mousedown',
        handler: this.start.bind(this)
      });

      targetEvents.push(
        {
          name: 'mousemove',
          handler: this.move.bind(this)
        },
        {
          name: 'mouseup',
          handler: this.end.bind(this)
        }
      );
    }

    this.wrapperEventRegister = new EventRegister(wrapper, wrapperEvents);
    this.targetEventRegister = new EventRegister(target, targetEvents);
  }

  private beforeHandler(e: TouchEvent, type: 'start' | 'move' | 'end') {
    const { preventDefault, stopPropagation, preventDefaultException } = this.options;

    const preventDefaultConditions = {
      start: () => {
        return preventDefault && !preventDefaultExceptionFn(e.target, preventDefaultException);
      },
      end: () => {
        return preventDefault && !preventDefaultExceptionFn(e.target, preventDefaultException);
      },
      move: () => {
        return preventDefault;
      }
    };

    if (preventDefaultConditions[type]()) {
      e.preventDefault();
    }

    if (stopPropagation) {
      e.stopPropagation();
    }
  }

  setInitiated(type: number = 0) {
    this.initiated = type;
  }

  private start(e: TouchEvent) {
    const eventType = eventTypeMap[e.type];

    if (this.initiated && this.initiated !== eventType) {
      return;
    }

    this.setInitiated(eventType);

    // 如果对在 tagException中 textarea 或者其他 html 标签进行了操作， 则不让 bs 滚动
    if (tagExceptionFn(e.target, this.options.tagException)) {
      this.setInitiated();
      return;
    }

    // 如果没有鼠标左键
    if (eventType === EventType.Mouse && e.button !== MouseButton.Left) return;

    // 如果在 beforeStart 中阻止了，则停止运行
    if (this.hooks.trigger(this.hooks.eventTypes.beforeStart, e)) {
      return;
    }

    this.beforeHandler(e, 'start');

    const point = (e.touches ? e.touches[0] : e) as Touch;
    this.pointX = point.pageX;
    this.pointY = point.pageY;

    this.hooks.trigger(this.hooks.eventTypes.start, e);
  }

  private move(e: TouchEvent) {
    if (eventTypeMap[e.type] !== this.initiated) {
      return;
    }

    this.beforeHandler(e, 'move');

    const point = (e.touches ? e.touches[0] : e) as Touch;
    const deltaX = point.pageX - this.pointX;
    const deltaY = point.pageY - this.pointY;
    this.pointX = point.pageX;
    this.pointY = point.pageY;

    // 通过我们自定义的 move 事件， 如果不满足移动的条件时，阻止运行
    // 常用于判断边界的时候
    if (
      this.hooks.trigger(this.hooks.eventTypes.move, {
        deltaX,
        deltaY,
        e
      })
    ) {
      return;
    }

    // 当超过 wrapper 容器后自动结束
    const scrollLeft = document.documentElement.scrollLeft || window.pageXOffset || document.body.scrollLeft;

    const scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;

    const pX = this.pointX - scrollLeft;
    const pY = this.pointY - scrollTop;

    if (
      // 右边界
      pX > document.documentElement.clientWidth - this.options.momentumLimitDistance ||
      // 左边界
      pX < this.options.momentumLimitDistance ||
      // 上边界
      pY < this.options.momentumLimitDistance ||
      // 下边界
      pY > document.documentElement.clientHeight - this.options.momentumLimitDistance
    ) {
      this.end(e);
    }
  }

  private end(e: TouchEvent) {
    if (eventTypeMap[e.type] !== this.initiated) {
      return;
    }

    this.setInitiated();

    this.beforeHandler(e, 'end');

    this.hooks.trigger(this.hooks.eventTypes.end, e);
  }

  private click(e: TouchEvent) {
    this.hooks.trigger(this.hooks.eventTypes.click, e);
  }

  destroy() {
    this.wrapperEventRegister.destroy();
    this.targetEventRegister.destroy();
    this.hooks.destroy();
  }
}
