import { createActionsHandlerOptions, createBehaviorOptions } from '@bsas/core/src/scroller/createOptions';
import { Options } from '@bsas/core/src/Options';

jest.mock('@bsas/core/src/Options');

describe('createOptions helper function tests', () => {
  let bsOptions: any;

  beforeEach(() => {
    bsOptions = new Options();
  });

  it('should return correct object when invoking createActionsHandlerOptions function', () => {
    const ret = createActionsHandlerOptions(bsOptions);

    expect(ret).toEqual({
      click: false,
      bindToWrapper: false,
      disableMouse: true,
      preventDefault: true,
      stopPropagation: false,
      preventDefaultException: {
        tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|AUDIO)$/
      }
    });
  });

  it('should return correct object when invoking createBehaviorOptions function', () => {
    const ret = createBehaviorOptions(bsOptions, 'scrollY', [true, true], {
      size: 'width',
      position: 'top'
    });

    expect(ret).toEqual({
      momentum: true,
      momentumLimitTime: 300,
      momentumLimitDistance: 15,
      deceleration: 0.0015,
      swipeBounceTime: 500,
      swipeTime: 2500,
      scrollable: true,
      bounces: [true, true],
      rect: {
        size: 'width',
        position: 'top'
      }
    });
  });
});
