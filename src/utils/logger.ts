/* eslint-disable no-console */
const noop = (): void => {};

export const logger = {
  debug: __DEV__ ? (...args: unknown[]) => console.debug('[DEV]', ...args) : noop,
  info: __DEV__ ? (...args: unknown[]) => console.info('[DEV]', ...args) : noop,
  warn: (...args: unknown[]): void => console.warn(...args),
  error: (...args: unknown[]): void => console.error(...args),
};
