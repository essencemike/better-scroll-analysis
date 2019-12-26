import BScroll from '../index';

describe('BetterScroll Core', () => {
  let bscroll: BScroll;
  const div = document.createElement('div');

  beforeEach(() => {
    bscroll = new BScroll(div, {});
  });

  afterEach(() => {
    BScroll.plugins = [];
    BScroll.pluginsMap = {};
  });

  it('should use plugins successfully when call use()', () => {
    const plugin = class MyPlugin {
      static pluginName = 'myPlugin';
    };

    BScroll.use(plugin);

    expect(BScroll.plugins.length).toBe(1);
  });

  it('should init plugins when set top-level of BScroll options', () => {
    const mockFn = jest.fn();
    const plugin = class MyPlugin {
      static pluginName = 'myPlugin';
      constructor(bscroll: BScroll) {
        mockFn(bscroll);
      }
    };

    BScroll.use(plugin);
    const wrapper = document.createElement('div');
    wrapper.appendChild(document.createElement('p'));

    const bs = new BScroll(wrapper, {
      myPlugin: true
    });

    expect(mockFn).toBeCalledWith(bs);
  });

  it('should throw error when wrapper is not a ElementNode or wrapper has no children', () => {
    const spy = jest.spyOn(console, 'error');
    const bs = new BScroll('.div', {});
    const bs2 = new BScroll(document.createElement('div'), {});

    expect(spy).toHaveBeenCalled();
    expect(spy).toBeCalledTimes(2);

    spy.mockRestore();
  });
});
