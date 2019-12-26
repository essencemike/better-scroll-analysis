import BScroll from '@bsas/core';
import { style } from '@bsas/shared-utils';
import EventHandler from '../event-handler';

jest.mock('@bsas/core');
jest.mock('../event-handler');

import Indicator, { IndicatorOption } from '../indicator';
import { Direction } from '../index';
import { mockDomClient } from '@bsas/core/src/__tests__/__utils__/layout';

describe('indicator unit tests', () => {
  let bscroll: BScroll;
  let indicatorOptions: IndicatorOption;
  let indicator: Indicator;

  beforeAll(() => {
    const wrapper = document.createElement('div');
    const content = document.createElement('div');
    wrapper.appendChild(content);

    bscroll = new BScroll(wrapper, {});
    bscroll.options.translateZ = '';

    bscroll.hasVerticalScroll = true;
    bscroll.scrollerHeight = 200;
    bscroll.maxScrollY = -100;
    bscroll.x = bscroll.y = -10;
  });

  beforeEach(() => {
    const indicatorWrapper = document.createElement('div');
    const indicatorEl = document.createElement('div');
    indicatorWrapper.appendChild(indicatorEl);

    mockDomClient(indicatorWrapper, { height: 100, width: 100 });

    indicatorOptions = {
      wrapper: indicatorWrapper,
      direction: 'vertical' as Direction,
      fade: true,
      interactive: true
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    bscroll.off();
  });

  describe('refresh', () => {
    beforeEach(() => {
      bscroll.hasHorizontalScroll = true;
      bscroll.scrollerWidth = 200;
      bscroll.maxScrollX = -100;
    });

    it('should update position and size correctly when direction is horizontal', () => {
      indicatorOptions.direction = 'horizontal' as Direction;
      indicator = new Indicator(bscroll, indicatorOptions);
      bscroll.trigger('refresh');

      expect(indicator.el.style.width).toBe('50px');
      expect(indicator.el.style[style.transform as any]).toBe('translateX(5px)');
    });

    it('should update position and size correctly when direction is vertical', () => {
      indicatorOptions.direction = 'vertical' as Direction;
      indicator = new Indicator(bscroll, indicatorOptions);

      bscroll.trigger('refresh');

      expect(indicator.el.style.height).toBe('50px');
      expect(indicator.el.style[style.transform as any]).toBe('translateY(5px)');
    });
  });

  describe('listen translater event translate', () => {
    beforeEach(() => {
      indicator = new Indicator(bscroll, indicatorOptions);
    });

    it('should calculate correctlly when content scroll down out of bounds', () => {
      bscroll.scroller.translater.hooks.trigger('translate', { x: 0, y: 10 });

      expect(indicator.el.style.height).toBe('35px');
    });

    it('should reach minimum size when content scroll down out of bounds too much', () => {
      bscroll.scroller.translater.hooks.trigger('translate', { x: 0, y: 30 });

      expect(indicator.el.style.height).toBe('8px');
    });

    it('should calculate correctlly when content scroll up out of bounds', () => {
      bscroll.scroller.translater.hooks.trigger('translate', { x: 0, y: -110 });

      expect(indicator.el.style.height).toBe('35px');
    });

    it('should reach minimum size when content scroll up out of bounds too much', () => {
      bscroll.scroller.translater.hooks.trigger('translate', { x: 0, y: -130 });

      expect(indicator.el.style.height).toBe('8px');
    });
  });

  describe('indicator fade', () => {
    it('indicator visible forever when fade false', () => {
      indicatorOptions.fade = false;
      indicator = new Indicator(bscroll, indicatorOptions);
      bscroll.trigger('scrollEnd');

      expect(indicator.wrapperStyle.opacity).toBe('');
    });

    it('indicator fade visible when trigger scrollEnd', () => {
      indicator = new Indicator(bscroll, indicatorOptions);
      bscroll.trigger('scrollStart');

      expect(indicator.wrapperStyle.opacity).toBe('1');
      expect(indicator.wrapperStyle[style.transitionDuration as any]).toBe('250ms');
    });

    it('indicator fade invisible when trigger scrollEnd', () => {
      indicator = new Indicator(bscroll, indicatorOptions);
      bscroll.trigger('scrollEnd');

      expect(indicator.wrapperStyle.opacity).toBe('0');
      expect(indicator.wrapperStyle[style.transitionDuration as any]).toBe('500ms');
    });
  });

  describe('indicator interactive', () => {
    it('should not instantiate EventHandler when interactive false', () => {
      indicatorOptions.interactive = false;
      indicator = new Indicator(bscroll, indicatorOptions);

      expect(EventHandler).toHaveBeenCalledTimes(0);
    });

    describe('listen eventHandler touchStart', () => {
      const beforeScrollStartHandler = jest.fn();
      beforeEach(() => {
        indicatorOptions.interactive = true;
        indicator = new Indicator(bscroll, indicatorOptions);
        bscroll.on('beforeScrollStart', beforeScrollStartHandler);
      });

      it('should trigger beforeScrollStart', () => {
        indicator.eventHandler.hooks.trigger('touchStart');

        expect(beforeScrollStartHandler).toBeCalledTimes(1);
      });
    });

    describe('listen eventHandler touchMove', () => {
      const scrollHandler = jest.fn();
      const scrollStartHandler = jest.fn();
      beforeEach(() => {
        indicatorOptions.interactive = true;
        indicator = new Indicator(bscroll, indicatorOptions);
        bscroll.on('scrollStart', scrollStartHandler);
        bscroll.on('scroll', scrollHandler);
      });

      it('should trigger scrollStart', () => {
        const moved = false;
        indicator.eventHandler.hooks.trigger('touchMove', moved, 10);

        expect(scrollStartHandler).toBeCalledTimes(1);
      });

      it('should trigger scroll event', () => {
        const moved = true;
        indicator.eventHandler.hooks.trigger('touchMove', moved, -10);

        expect(scrollHandler).toBeCalledTimes(1);
      });

      it('should scroll to correct position', () => {
        const moved = true;
        indicator.eventHandler.hooks.trigger('touchMove', moved, 10);

        expect(bscroll.scrollTo).toBeCalledWith(-10, -30);
      });

      it('should scroll to top when reach top boundary', () => {
        const moved = true;
        indicator.eventHandler.hooks.trigger('touchMove', moved, -10);

        expect(bscroll.scrollTo).toBeCalledWith(-10, -0);
      });

      it('should scroll to bottom when reach bottom boundary', () => {
        const moved = true;
        indicator.eventHandler.hooks.trigger('touchMove', moved, 60);

        expect(bscroll.scrollTo).toBeCalledWith(-10, -100);
      });
    });

    describe('listen eventHandler touchEnd', () => {
      const scrollEndHandler = jest.fn();

      beforeEach(() => {
        indicatorOptions.interactive = true;
        indicator = new Indicator(bscroll, indicatorOptions);
        bscroll.on('scrollEnd', scrollEndHandler);
      });

      it('should not trigger scrollEnd when not moved', () => {
        const moved = false;
        indicator.eventHandler.hooks.trigger('touchEnd', moved);

        expect(scrollEndHandler).toBeCalledTimes(0);
      });

      it('should trigger scrollEnd when moved', () => {
        const moved = true;
        indicator.eventHandler.hooks.trigger('touchEnd', moved);

        expect(scrollEndHandler).toBeCalledTimes(1);
      });
    });
  });
});
