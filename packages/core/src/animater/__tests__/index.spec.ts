import Translater from '@bsas/core/src/translater';
import Transition from '@bsas/core/src/animater/Transition';
import Animation from '@bsas/core/src/animater/Animation';
import { Options } from '@bsas/core/src/Options';
jest.mock('@bsas/core/src/animater/Animation');
jest.mock('@bsas/core/src/animater/Transition');
jest.mock('@bsas/core/src/animater/Base');
jest.mock('@bsas/core/src/translater');
jest.mock('@bsas/core/src/Options');

import createAnimater from '../index';

describe('animater create test suit', () => {
  const dom = document.createElement('div');
  const translater = new Translater(dom);

  it('should create Transition class when useTransition=true', () => {
    const options = new Options();
    options.probeType = 0;
    options.useTransition = true;
    const animater = createAnimater(dom, translater as any, options);

    expect(Transition).toBeCalledWith(dom, translater, { probeType: 0 });
  });

  it('should create Animation class when useTransition=false', () => {
    const options = new Options();
    options.probeType = 0;
    options.useTransition = false;
    const animater = createAnimater(dom, translater as any, options);

    expect(Animation).toBeCalledWith(dom, translater, { probeType: 0 });
  });
});
