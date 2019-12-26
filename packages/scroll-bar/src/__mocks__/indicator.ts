const mockIndicator = jest.fn().mockImplementation((bscroll: any, options: any) => {
  return {
    wrapper: options.wrapper,
    destroy: jest.fn()
  };
});

export default mockIndicator;
