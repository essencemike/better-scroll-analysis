import { EventEmitter } from '@bsas/shared-utils';

const EventHandler = jest.fn().mockImplementation(() => {
  return {
    hooks: new EventEmitter(['touchStart', 'touchMove', 'touchEnd'])
  };
});

export default EventHandler;
