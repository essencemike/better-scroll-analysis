import Behavior from '../Behavior';
import createAnimater from '../../animater';
import Translater from '../../translater';
import { Options } from '../../Options';
import ActionsHandler from '../../base/ActionsHandler';

jest.mock('../Behavior');
jest.mock('../../animater');
jest.mock('../../translater');
jest.mock('../../Options');
jest.mock('../../base/ActionsHandler');

import Actions from '../Actions';

describe('Actions Class tests', () => {
  let actions: Actions;
  beforeEach(() => {
    Object.defineProperty(window, 'performance', {
      get() {
        return undefined;
      }
    });

    const content = document.createElement('div');
    const wrapper = document.createElement('div');
    const bscrollOptions = new Options() as any;
    const scrollBehaviorX = new Behavior(content, bscrollOptions);
    const scrollBehaviorY = new Behavior(content, bscrollOptions);
    const actionsHandler = new ActionsHandler(wrapper, bscrollOptions);
    const translater = new Translater(content);
    const animater = createAnimater(content, translater, bscrollOptions);
    actions = new Actions(scrollBehaviorX, scrollBehaviorY, actionsHandler, animater, bscrollOptions);
  });

  it('should init hooks when call constructor function', () => {
    expect(actions.hooks.eventTypes).toHaveProperty('start');
    expect(actions.hooks.eventTypes).toHaveProperty('beforeMove');
    expect(actions.hooks.eventTypes).toHaveProperty('scroll');
    expect(actions.hooks.eventTypes).toHaveProperty('beforeEnd');
    expect(actions.hooks.eventTypes).toHaveProperty('end');
    expect(actions.hooks.eventTypes).toHaveProperty('scrollEnd');
  });

  it('should invoke handleStart when actionsHandler trigger start hook', () => {
    actions.actionsHandler.hooks.trigger('start');

    expect(actions.moved).toBe(false);
    expect(actions.scrollBehaviorX.start).toBeCalled();
    expect(actions.scrollBehaviorY.start).toBeCalled();
    expect(actions.scrollBehaviorX.resetStartPos).toBeCalled();
    expect(actions.scrollBehaviorY.resetStartPos).toBeCalled();
    expect(actions.animater.stop).toBeCalled();
  });

  it('should invoke handleMove when actionsHandler trigger move hook', () => {
    const e = new Event('touchmove');
    const beforeMoveMockHandler = jest.fn();
    const scrollStartHandler = jest.fn();
    const scrollHandler = jest.fn();
    actions.hooks.on('beforeMove', beforeMoveMockHandler);
    actions.hooks.on('scrollStart', scrollStartHandler);
    actions.hooks.on('scroll', scrollHandler);
    actions.actionsHandler.hooks.trigger('move', {
      e,
      deltaX: 0,
      deltaY: -20
    });

    expect(beforeMoveMockHandler).toBeCalled();
    expect(beforeMoveMockHandler).toHaveBeenCalledWith(e);
    expect(scrollStartHandler).toBeCalled();
    expect(scrollHandler).not.toBeCalled();

    expect(actions.scrollBehaviorX.getAbsDist).toBeCalled();
    expect(actions.scrollBehaviorY.getAbsDist).toBeCalled();
    expect(actions.scrollBehaviorX.getAbsDist).toHaveBeenCalledWith(0);
    expect(actions.scrollBehaviorY.getAbsDist).toHaveBeenCalledWith(-20);
    expect(actions.scrollBehaviorX.move).toBeCalled();
    expect(actions.scrollBehaviorY.move).toBeCalled();
    expect(actions.scrollBehaviorX.move).toHaveBeenCalledWith(0);
    expect(actions.scrollBehaviorY.move).toHaveBeenCalledWith(-20);
  });

  it('should invoke handleEnd when actionsHandler trigger end hook', () => {
    const beforeEndMockHandler = jest.fn();
    const endMockHandler = jest.fn();
    const scrollEndHandler = jest.fn();
    const e = new Event('touchend');
    actions.hooks.on('beforeEnd', beforeEndMockHandler);
    actions.hooks.on('end', endMockHandler);
    actions.hooks.on('scrollEnd', scrollEndHandler);
    actions.actionsHandler.hooks.trigger('end', e);

    expect(beforeEndMockHandler).toBeCalled();
    expect(actions.scrollBehaviorX.updateDirection).toBeCalled();
    expect(actions.scrollBehaviorY.updateDirection).toBeCalled();
    expect(endMockHandler).toBeCalled();
    expect(scrollEndHandler).toBeCalled();
  });

  it('should get correct position when invoking getCurrentPos method', () => {
    actions.getCurrentPos();
    expect(actions.scrollBehaviorX.getCurrentPos).toBeCalled();
    expect(actions.scrollBehaviorY.getCurrentPos).toBeCalled();
  });

  it('should reset endTime when refreshed', () => {
    actions.refresh();

    expect(actions.endTime).toBe(0);
  });

  it('should gc when invoking destroy method', () => {
    actions.destroy();

    expect(actions.hooks.events).toEqual({});
    expect(actions.hooks.eventTypes).toEqual({});
  });
});
