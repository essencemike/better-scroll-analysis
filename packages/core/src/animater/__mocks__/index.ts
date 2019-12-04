import Transition from '@bsas/core/src/animater/Transition';
import Animation from '@bsas/core/src/animater/Animation';

jest.mock('@bsas/core/src/animater/Transition');
jest.mock('@bsas/core/src/animater/Animation');

const createAnimater = jest.fn().mockImplementation((element, translater, bscrollOptions) => {
  if (bscrollOptions.useTransition) {
    return new Transition(
      element,
      translater,
      bscrollOptions as {
        probeType: number;
      }
    );
  }

  return new Animation(
    element,
    translater,
    bscrollOptions as {
      probeType: number;
    }
  );
});

export default createAnimater;
