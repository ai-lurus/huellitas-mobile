import { BREAKPOINT_TABLET } from './breakpoints';

describe('breakpoints', () => {
  it('defines the width at which the footer switches from full-bar to floating', () => {
    expect(BREAKPOINT_TABLET).toBe(400);
  });
});
