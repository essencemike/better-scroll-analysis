import { EventEmitter } from '@bsas/shared-utils';

const Translater = jest.fn().mockImplementation(content => {
  return {
    style: content.style,
    hooks: new EventEmitter(['beforeTranslate', 'translate']),
    getComputedPosition: jest.fn(),
    translate: jest.fn(),
    destroy: jest.fn()
  };
});

export default Translater;
