import ActionsHandler, { Options } from '@bsas/core/src/base/ActionsHandler';
import { dispatchTouch, dispatchMouse } from '@bsas/core/src/__tests__/__utils__/event';

describe('ActionsHandler', () => {
  let actionsHandler: ActionsHandler;
  let wrapper: HTMLElement;
  let options: Options;

  beforeEach(() => {
    wrapper = document.createElement('wrapper');
    options = {
      click: false,
      bindToWrapper: false,
      disableMouse: false,
      disableTouch: false,
      preventDefault: true,
      stopPropagation: true,
      preventDefaultException: {
        tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|AUDIO)$/
      },
      tagException: { tagName: /^TEXTAREA$/ },
      momentumLimitDistance: 15
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should bind click handler when options.disableMouse is true', () => {
    actionsHandler = new ActionsHandler(wrapper, options);

    const wrapperEventsName = actionsHandler.wrapperEventRegister.events.map(event => event.name);

    const targetEventsName = actionsHandler.targetEventRegister.events.map(event => event.name);

    expect(wrapperEventsName).toMatchObject(['mousedown']);
    expect(targetEventsName).toMatchObject(['mousemove', 'mouseup']);
  });
});
