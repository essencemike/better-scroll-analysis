import BScroll, { Options } from '@bsas/core';
import Indicator from '../indicator';

jest.mock('@bsas/core');
jest.mock('../indicator');

import ScrollBar from '../index';

describe('scroll-bar unit tests', () => {
  let bscroll: BScroll;
  let options: Partial<Options>;

  const CONFIG_SCROLL_BAR = {
    fade: true,
    interactive: true
  };

  beforeAll(() => {
    const wrapper = document.createElement('div');
    const content = document.createElement('div');
    wrapper.appendChild(content);

    options = {
      scrollbar: CONFIG_SCROLL_BAR,
      scrollX: true,
      scrollY: true
    };

    bscroll = new BScroll(wrapper, options);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should new indicators', () => {
      new ScrollBar(bscroll);
      expect(Indicator).toBeCalledTimes(2);
    });

    it('should create indicator elements', () => {
      new ScrollBar(bscroll);
      expect(bscroll.wrapper).toMatchSnapshot();
    });
  });

  it('should destroy scrollbar when bscroll destroy', () => {
    const scrollbar = new ScrollBar(bscroll);
    scrollbar.destroy();

    expect(scrollbar.indicators[0].destroy).toBeCalledTimes(1);
    expect(scrollbar.indicators[1].destroy).toBeCalledTimes(1);
  });
});
