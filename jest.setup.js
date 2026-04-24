jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
  };
});

// Evita warnings de "not wrapped in act(...)" con React Query en tests.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { notifyManager } = require('@tanstack/query-core');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { act } = require('@testing-library/react-native');
  notifyManager.setNotifyFunction((fn) => act(fn));
} catch {
  // noop (si el módulo no existe en algún entorno de test)
}

// Evita warnings de act() provenientes de VirtualizedList/FlatList (timers internos).
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const VirtualizedList = require('react-native/Libraries/Lists/VirtualizedList');

  const original = VirtualizedList.defaultProps ?? {};
  VirtualizedList.defaultProps = {
    ...original,
    // Desactiva batching basado en timers dentro de tests.
    updateCellsBatchingPeriod: 0,
    windowSize: 5,
  };
} catch {
  // noop
}

// Silencia SOLO el warning conocido de VirtualizedList + act() (sin ocultar otros errores).
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args
    .map((a) => (typeof a === 'string' ? a : a instanceof Error ? a.message : ''))
    .join(' ');
  if (message.includes('An update to VirtualizedList inside a test was not wrapped in act')) {
    return;
  }
  originalConsoleError(...args);
};
