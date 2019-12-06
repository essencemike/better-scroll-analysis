import createAnimater from '@bsas/core/src/animater';
import Translater from '@bsas/core/src/translater';
import Behavior from '@bsas/core/src/scroller/Behavior';
import ActionsHandler from '@bsas/core/src/base/ActionsHandler';
import Actions from '@bsas/core/src/scroller/Actions';

jest.mock('@bsas/core/src/animater');
jest.mock('@bsas/core/src/translater');
jest.mock('@bsas/core/src/scroller/Behavior');
jest.mock('@bsas/core/src/base/ActionsHandler');
jest.mock('@bsas/core/src/scroller/Actions');

import EventEmitter from '@bsas/core/src/base/EventEmitter';
import EventRegister from '@bsas/core/src/base/EventRegister';

const Scroller = jest.fn().mockImplementation((wrapper, bscrollOptions) => {
  const content = wrapper.children[0];
  const translater = new Translater(content);
  const animater = createAnimater(content, translater, bscrollOptions);
  const actionsHandler = new ActionsHandler(wrapper, bscrollOptions);
  const scrollBehaviorX = new Behavior(wrapper, Object.assign(bscrollOptions, { scrollable: bscrollOptions.scrollX }));
  const scrollBehaviorY = new Behavior(wrapper, Object.assign(bscrollOptions, { scrollable: bscrollOptions.scrollY }));
  const actions = new Actions(scrollBehaviorX, scrollBehaviorY, actionsHandler, animater, bscrollOptions);
  return {
    wrapper,
    content,
    translater,
    animater,
    actionsHandler,
    actions,
    scrollBehaviorX,
    scrollBehaviorY,
    options: bscrollOptions,
    hooks: new EventEmitter([
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
      'scrollToElement',
      'transitionEnd',
      'checkClick',
      'ignoreDisMoveForSamePos'
    ]),
    resizeRegister: new EventRegister(wrapper, []),
    transitionEndRegister: new EventRegister(wrapper, [])
  };
});

export default Scroller;
