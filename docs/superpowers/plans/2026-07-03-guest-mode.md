# Guest Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let someone explore Radar (mapa/lista de mascotas perdidas y detalle de reporte) and the Servicios catalog without an account, while every other screen and every write action still requires signing in.

**Architecture:** A single `isGuest` boolean lives in the existing `authStore` (Zustand, in-memory only, never persisted). A reusable `useGuestGate()` hook reads that flag and exposes `requireAuth(action)` — runs `action` immediately for real users, or opens a shared `AuthRequiredModal` for guests — plus a `GuestGateModal` component each consumer renders in its own tree. `AppTabBar` uses the same hook to block the Inicio/Mascotas/Perfil tabs for guests while leaving Radar/Servicios always reachable.

**Tech Stack:** React Native, Expo Router (typed routes), Zustand, Jest + @testing-library/react-native.

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-07-03-guest-mode-design.md` — every requirement below traces back to it.
- All UI copy is in Spanish, matching the rest of the app (see existing screens for tone).
- `testID`s follow the existing dot-separated convention (`screen.element`, e.g. `authRequiredModal.signIn`).
- Commit subjects must be fully lowercase (commitlint `subject-case: lower-case`), type from `['feat','fix','refactor','docs','test','chore','perf','ci']`, max 72 chars. Husky/lint-staged auto-runs `eslint --fix` + `prettier --write` on staged `*.{ts,tsx}` files on every commit — do not fight it, just re-run tests after if unsure.
- `isGuest` is **never** persisted to AsyncStorage — closing/reopening the app always lands on sign-in (per spec's "Persistencia" section). Do not add any storage wiring for it.
- Deviation from the literal spec text, made for correctness: the spec's "Entrada al modo invitado" section says to call `router.replace('/(app)')` after `enterGuestMode()`. `/(app)` resolves to the `index` tab (Dashboard), which is one of the screens guests must not reach — landing there would immediately violate the "no Dashboard for guests" rule. Task 4 below instead navigates to `/(app)/map` (Radar), the first screen guests are actually allowed to see. This preserves the spec's intent; flag it to the user as a deliberate fix when the plan is presented.
- Existing tests currently pass with a known, pre-existing baseline of `tsc` errors (36 errors across 6 unrelated files) and 3 pre-existing failing Jest suites (navigation-container / `Location.getBackgroundPermissionsAsync` issues, unrelated to auth). None of that baseline should change as a result of this plan — the final task verifies it explicitly.

---

### Task 1: `isGuest` state in `authStore`

**Files:**

- Modify: `src/stores/authStore.ts`
- Test: `src/stores/__tests__/authStore.test.ts` (new)

**Interfaces:**

- Produces: `useAuthStore.getState().isGuest: boolean` (default `false`), `useAuthStore.getState().enterGuestMode(): void`, and `clearAuth()` now also resets `isGuest` to `false`. Every later task reads `isGuest` via `useAuthStore((s) => s.isGuest)`.

- [ ] **Step 1: Write the failing test**

Create `src/stores/__tests__/authStore.test.ts`:

```ts
import { useAuthStore } from '../authStore';

describe('useAuthStore — guest mode', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isGuest: false });
  });

  it('isGuest es false por defecto', () => {
    expect(useAuthStore.getState().isGuest).toBe(false);
  });

  it('enterGuestMode pone isGuest en true', () => {
    useAuthStore.getState().enterGuestMode();
    expect(useAuthStore.getState().isGuest).toBe(true);
  });

  it('clearAuth resetea isGuest a false junto con user e isAuthenticated', () => {
    useAuthStore.getState().enterGuestMode();
    useAuthStore.getState().clearAuth();

    expect(useAuthStore.getState().isGuest).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/stores/__tests__/authStore.test.ts`
Expected: FAIL — `enterGuestMode is not a function` / `isGuest` is `undefined`.

- [ ] **Step 3: Write minimal implementation**

Replace the full contents of `src/stores/authStore.ts`:

```ts
import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
  enterGuestMode: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isGuest: false,
  setUser: (user): void => set(() => ({ user, isAuthenticated: user !== null })),
  clearAuth: (): void => set(() => ({ user: null, isAuthenticated: false, isGuest: false })),
  enterGuestMode: (): void => set(() => ({ isGuest: true })),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/stores/__tests__/authStore.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/stores/authStore.ts src/stores/__tests__/authStore.test.ts
git commit -m "$(cat <<'EOF'
feat: add guest mode flag to auth store

EOF
)"
```

---

### Task 2: `AuthRequiredModal` component

**Files:**

- Create: `src/components/auth/AuthRequiredModal.tsx`
- Test: `src/components/auth/AuthRequiredModal.test.tsx` (new)

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces: `AuthRequiredModal({ visible: boolean; onClose: () => void }): React.JSX.Element`. Task 3's `useGuestGate` renders this directly.

- [ ] **Step 1: Write the failing test**

Create `src/components/auth/AuthRequiredModal.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { AuthRequiredModal } from './AuthRequiredModal';

describe('AuthRequiredModal', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('no renderiza contenido cuando visible es false', () => {
    const { queryByTestId } = render(<AuthRequiredModal visible={false} onClose={jest.fn()} />);
    expect(queryByTestId('authRequiredModal.signIn')).toBeNull();
  });

  it('navega a sign-in y cierra el modal al tocar "Iniciar sesión"', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<AuthRequiredModal visible onClose={onClose} />);

    fireEvent.press(getByTestId('authRequiredModal.signIn'));

    expect(onClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-in');
  });

  it('navega a sign-up y cierra el modal al tocar "Crear cuenta"', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<AuthRequiredModal visible onClose={onClose} />);

    fireEvent.press(getByTestId('authRequiredModal.signUp'));

    expect(onClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-up');
  });

  it('cierra el modal al tocar el backdrop', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<AuthRequiredModal visible onClose={onClose} />);

    fireEvent.press(getByTestId('authRequiredModal.backdrop'));

    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/auth/AuthRequiredModal.test.tsx`
Expected: FAIL — cannot find module `./AuthRequiredModal`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/auth/AuthRequiredModal.tsx`:

```tsx
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { colors, radius, shadows, spacing, typography } from '../../design/tokens';

export interface AuthRequiredModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AuthRequiredModal({ visible, onClose }: AuthRequiredModalProps): React.JSX.Element {
  const router = useRouter();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="authRequiredModal.backdrop" />
      <View style={styles.sheet}>
        <Text style={styles.title}>Inicia sesión para continuar</Text>
        <Text style={styles.subtitle}>Esto solo está disponible si inicias sesión.</Text>

        <Pressable
          accessibilityRole="button"
          testID="authRequiredModal.signIn"
          onPress={() => {
            onClose();
            router.push('/(auth)/sign-in');
          }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          testID="authRequiredModal.signUp"
          onPress={() => {
            onClose();
            router.push('/(auth)/sign-up');
          }}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>Crear cuenta</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: '30%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.md,
  },
  title: {
    color: colors.textPrimary,
    ...typography.heading,
  },
  subtitle: {
    color: colors.textSecondary,
    ...typography.body,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    ...typography.button,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelText: {
    color: colors.textSecondary,
    ...typography.bodyStrong,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/auth/AuthRequiredModal.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/AuthRequiredModal.tsx src/components/auth/AuthRequiredModal.test.tsx
git commit -m "$(cat <<'EOF'
feat: add auth-required modal for guest gating

EOF
)"
```

---

### Task 3: `useGuestGate` hook

**Files:**

- Create: `src/hooks/useGuestGate.tsx`
- Test: `src/hooks/useGuestGate.test.tsx` (new)

**Interfaces:**

- Consumes: `useAuthStore` (Task 1) — reads `isGuest`. `AuthRequiredModal` (Task 2).
- Produces: `useGuestGate(): { isGuest: boolean; requireAuth: (action: () => void) => void; GuestGateModal: () => React.JSX.Element }`. Every screen-level task below (5–10) imports this hook.

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useGuestGate.test.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react-native';

import { useGuestGate } from './useGuestGate';
import { useAuthStore } from '../stores/authStore';

describe('useGuestGate', () => {
  beforeEach(() => {
    useAuthStore.setState({ isGuest: false });
  });

  it('ejecuta la acción de inmediato cuando isGuest es false', () => {
    const { result } = renderHook(() => useGuestGate());
    const action = jest.fn();

    act(() => {
      result.current.requireAuth(action);
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('no ejecuta la acción cuando isGuest es true', () => {
    useAuthStore.setState({ isGuest: true });
    const { result } = renderHook(() => useGuestGate());
    const action = jest.fn();

    act(() => {
      result.current.requireAuth(action);
    });

    expect(action).not.toHaveBeenCalled();
  });

  it('expone isGuest reflejando el estado del store', () => {
    useAuthStore.setState({ isGuest: true });
    const { result } = renderHook(() => useGuestGate());

    expect(result.current.isGuest).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/hooks/useGuestGate.test.tsx`
Expected: FAIL — cannot find module `./useGuestGate`.

- [ ] **Step 3: Write minimal implementation**

Create `src/hooks/useGuestGate.tsx`:

```tsx
import React, { useState } from 'react';

import { AuthRequiredModal } from '../components/auth/AuthRequiredModal';
import { useAuthStore } from '../stores/authStore';

export interface UseGuestGateResult {
  isGuest: boolean;
  requireAuth: (action: () => void) => void;
  GuestGateModal: () => React.JSX.Element;
}

export function useGuestGate(): UseGuestGateResult {
  const isGuest = useAuthStore((s) => s.isGuest);
  const [visible, setVisible] = useState(false);

  const requireAuth = (action: () => void): void => {
    if (isGuest) {
      setVisible(true);
      return;
    }
    action();
  };

  const GuestGateModal = (): React.JSX.Element => (
    <AuthRequiredModal visible={visible} onClose={() => setVisible(false)} />
  );

  return { isGuest, requireAuth, GuestGateModal };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/hooks/useGuestGate.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGuestGate.tsx src/hooks/useGuestGate.test.tsx
git commit -m "$(cat <<'EOF'
feat: add useGuestGate hook for gating guest actions

EOF
)"
```

---

### Task 4: "Continuar sin cuenta" entry point on sign-in

**Files:**

- Modify: `app/(auth)/sign-in.tsx`
- Test: `src/__tests__/sign-in-screen.test.tsx`

**Interfaces:**

- Consumes: `useAuthStore.getState().enterGuestMode()` (Task 1).

- [ ] **Step 1: Write the failing test**

In `src/__tests__/sign-in-screen.test.tsx`, add a `mockEnterGuestMode` and wire it into the existing `authStore` mock, then add a new test.

Change:

```tsx
jest.mock('../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ setUser: jest.fn() }),
  },
}));
```

to:

```tsx
const mockEnterGuestMode = jest.fn();

jest.mock('../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ setUser: jest.fn(), enterGuestMode: mockEnterGuestMode }),
  },
}));
```

In the `beforeEach`, add `mockEnterGuestMode.mockClear();` alongside the existing `mockReplace.mockClear(); mockPush.mockClear(); mockBack.mockClear(); runGoogleSignInFlow.mockReset();`.

At the end of the `describe('SignInScreen', ...)` block, add:

```tsx
it('entra en modo invitado y navega a Radar al tocar "Continuar sin cuenta"', () => {
  const { getByTestId } = render(<SignInScreen />);

  fireEvent.press(getByTestId('signIn.continueAsGuest'));

  expect(mockEnterGuestMode).toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith('/(app)/map');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/sign-in-screen.test.tsx`
Expected: FAIL — `Unable to find an element with testID: signIn.continueAsGuest`.

- [ ] **Step 3: Write minimal implementation**

In `app/(auth)/sign-in.tsx`:

Change the imports at the top:

```tsx
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../src/design/tokens';
import { SignInForm } from '../../src/components/auth/SignInForm';
import { useKeyboardHeight } from '../../src/hooks/useKeyboardHeight';
import { runGoogleSignInFlow } from '../../src/services/googleAuthService';
```

to:

```tsx
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../src/design/tokens';
import { SignInForm } from '../../src/components/auth/SignInForm';
import { useKeyboardHeight } from '../../src/hooks/useKeyboardHeight';
import { runGoogleSignInFlow } from '../../src/services/googleAuthService';
import { useAuthStore } from '../../src/stores/authStore';
```

Right after the closing `/>` of `<SignInForm ... />` (still inside `<ScrollView>`), add:

```tsx
<Pressable
  accessibilityRole="button"
  testID="signIn.continueAsGuest"
  onPress={() => {
    useAuthStore.getState().enterGuestMode();
    router.replace('/(app)/map' as Href);
  }}
  style={styles.guestLink}
  hitSlop={8}
>
  <Text style={styles.guestLinkText}>Continuar sin cuenta</Text>
</Pressable>
```

In the `styles` object, add two new entries:

```ts
  guestLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  guestLinkText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/sign-in-screen.test.tsx`
Expected: PASS (all tests in the file, including the new one).

- [ ] **Step 5: Commit**

```bash
git add "app/(auth)/sign-in.tsx" src/__tests__/sign-in-screen.test.tsx
git commit -m "$(cat <<'EOF'
feat: add continue-as-guest entry point on sign-in

EOF
)"
```

---

### Task 5: Gate Inicio/Mascotas/Perfil tabs in `AppTabBar`

**Files:**

- Modify: `src/components/navigation/AppTabBar.tsx`
- Test: `src/components/navigation/AppTabBar.test.tsx`

**Interfaces:**

- Consumes: `useGuestGate()` (Task 3).

- [ ] **Step 1: Write the failing test**

In `src/components/navigation/AppTabBar.test.tsx`, add a mock for `expo-router` (required because `AppTabBar` now renders `AuthRequiredModal`, which calls `useRouter()` on every render, even when the modal is hidden) and import `useAuthStore`. Add these near the top, after the existing `jest.mock('../icons/PlakaIcon', ...)` block:

```tsx
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
```

Add `import { useAuthStore } from '../../stores/authStore';` to the existing import block.

Add a new `describe` block at the end of the file, before the final closing of the outer `describe('AppTabBar', ...)` — i.e. as a sibling top-level describe after it:

```tsx
describe('AppTabBar en modo invitado', () => {
  beforeEach(() => {
    mockUseWindowDimensions.mockReturnValue({ width: 375, height: 812, scale: 2, fontScale: 1 });
    useAuthStore.setState({ isGuest: true });
  });

  afterEach(() => {
    useAuthStore.setState({ isGuest: false });
  });

  it('no navega y muestra el modal de login al tocar Inicio', () => {
    const props = buildProps({ index: 2 });
    const { getByTestId } = render(<AppTabBar {...props} />);

    fireEvent.press(getByTestId('tab.index'));

    expect(props.navigation.navigate).not.toHaveBeenCalled();
    expect(getByTestId('authRequiredModal.signIn')).toBeTruthy();
  });

  it('no navega y muestra el modal de login al tocar Mascotas', () => {
    const props = buildProps({ index: 2 });
    const { getByTestId } = render(<AppTabBar {...props} />);

    fireEvent.press(getByTestId('tab.pets'));

    expect(props.navigation.navigate).not.toHaveBeenCalled();
    expect(getByTestId('authRequiredModal.signIn')).toBeTruthy();
  });

  it('no navega y muestra el modal de login al tocar Perfil', () => {
    const props = buildProps({ index: 2 });
    const { getByTestId } = render(<AppTabBar {...props} />);

    fireEvent.press(getByTestId('tab.profile'));

    expect(props.navigation.navigate).not.toHaveBeenCalled();
    expect(getByTestId('authRequiredModal.signIn')).toBeTruthy();
  });

  it('navega normalmente al tocar Radar', () => {
    const props = buildProps({ index: 0 });
    const { getByTestId, queryByTestId } = render(<AppTabBar {...props} />);

    fireEvent.press(getByTestId('tab.map'));

    expect(props.navigation.navigate).toHaveBeenCalledWith('map');
    expect(queryByTestId('authRequiredModal.signIn')).toBeNull();
  });

  it('navega normalmente al tocar Servicios', () => {
    const props = buildProps({ index: 0 });
    const { getByTestId, queryByTestId } = render(<AppTabBar {...props} />);

    fireEvent.press(getByTestId('tab.services'));

    expect(props.navigation.navigate).toHaveBeenCalledWith('services');
    expect(queryByTestId('authRequiredModal.signIn')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/navigation/AppTabBar.test.tsx`
Expected: FAIL — pressing `tab.index` still calls `navigation.navigate`, and `authRequiredModal.signIn` is never found.

- [ ] **Step 3: Write minimal implementation**

In `src/components/navigation/AppTabBar.tsx`, add the import and the gated-routes set near the top:

```tsx
import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import { BREAKPOINT_TABLET } from '../../design/breakpoints';
import { useGuestGate } from '../../hooks/useGuestGate';

import { PlakaIcon } from '../icons/PlakaIcon';

const TAB_ICON = 22;
const FLOATING_MARGIN = 16;
// Orden y set de tabs del PRD: Inicio/Mascotas/Radar/Servicios/Perfil.
const TAB_ROUTES = new Set(['index', 'pets', 'map', 'services', 'profile']);
// Tabs que requieren cuenta; Radar y Servicios quedan siempre abiertos.
const GUEST_GATED_ROUTES = new Set(['index', 'pets', 'profile']);
```

Inside the component, right after `const isFloating = width >= BREAKPOINT_TABLET;`, add:

```tsx
const { isGuest, requireAuth, GuestGateModal } = useGuestGate();
```

Replace the `onPress` definition inside the `.map()` callback:

```tsx
const onPress = (): void => {
  const event = navigation.emit({
    type: 'tabPress',
    target: route.key,
    canPreventDefault: true,
  });
  if (!isFocused && !event.defaultPrevented) {
    navigation.navigate(route.name);
  }
};
```

with:

```tsx
const navigate = (): void => {
  const event = navigation.emit({
    type: 'tabPress',
    target: route.key,
    canPreventDefault: true,
  });
  if (!isFocused && !event.defaultPrevented) {
    navigation.navigate(route.name);
  }
};

const onPress = (): void => {
  if (isGuest && GUEST_GATED_ROUTES.has(route.name)) {
    requireAuth(navigate);
    return;
  }
  navigate();
};
```

Finally, add `<GuestGateModal />` as a sibling of the tabs row, inside the outer wrap `<View>`:

```tsx
      </View>
      <GuestGateModal />
    </View>
  );
}
```

(this replaces the previous `</View>\n    </View>\n  );\n}` closing sequence — the tabs-row `</View>` stays where it is, `<GuestGateModal />` is inserted between it and the outer wrap's closing `</View>`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/navigation/AppTabBar.test.tsx`
Expected: PASS (all existing tests plus the 5 new ones).

- [ ] **Step 5: Commit**

```bash
git add src/components/navigation/AppTabBar.tsx src/components/navigation/AppTabBar.test.tsx
git commit -m "$(cat <<'EOF'
feat: gate inicio/mascotas/perfil tabs for guests

EOF
)"
```

---

### Task 6: Gate the Radar FAB (create report) in `map.tsx`

**Files:**

- Modify: `app/(app)/map.tsx`
- Test: `src/__tests__/home-map-screen.test.tsx`

**Interfaces:**

- Consumes: `useGuestGate()` (Task 3).

- [ ] **Step 1: Write the failing test**

In `src/__tests__/home-map-screen.test.tsx`, add `import { useAuthStore } from '../stores/authStore';` to the top imports. Add a new test inside the existing `describe('Map tab screen', ...)` block:

```tsx
it('modo invitado: el FAB abre el modal de login en vez de la hoja de reporte', () => {
  useAuthStore.setState({ isGuest: true });

  const { getByTestId } = render(<MapScreen />);
  fireEvent.press(getByTestId('map.fab'));

  expect(getByTestId('authRequiredModal.signIn')).toBeTruthy();

  useAuthStore.setState({ isGuest: false });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/home-map-screen.test.tsx`
Expected: FAIL — `Unable to find an element with testID: authRequiredModal.signIn`.

- [ ] **Step 3: Write minimal implementation**

In `app/(app)/map.tsx`, add the import alongside the other hook imports:

```tsx
import { useLostReports } from '../../src/hooks/useLostReports';
import { useGuestGate } from '../../src/hooks/useGuestGate';
```

Inside the component function, add near the other hook calls (e.g. right after the `useLostReports` call or near `handleFab`'s definition):

```tsx
const { requireAuth, GuestGateModal } = useGuestGate();
```

Change the FAB's `onPress`:

```tsx
      <Pressable
        onPress={handleFab}
        style={[styles.fab, layer === 'lugares' && styles.fabGreen]}
        testID="map.fab"
      >
```

to:

```tsx
      <Pressable
        onPress={() => requireAuth(handleFab)}
        style={[styles.fab, layer === 'lugares' && styles.fabGreen]}
        testID="map.fab"
      >
```

Add `<GuestGateModal />` right before the outer screen `</View>` closes (after the `<RouteBottomSheet ... />` block):

```tsx
      <RouteBottomSheet
        route={selectedRoute}
        visible={selectedRoute != null}
        onClose={() => setSelectedRoute(null)}
        onViewDetail={openRoute}
        onRate={(routeId, rating) => rateRouteMutation.mutate({ routeId, rating })}
        isRating={rateRouteMutation.isPending}
      />

      <GuestGateModal />
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/home-map-screen.test.tsx`
Expected: PASS (all existing tests plus the new one).

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/map.tsx" src/__tests__/home-map-screen.test.tsx
git commit -m "$(cat <<'EOF'
feat: gate radar fab for guests

EOF
)"
```

---

### Task 7: Gate "Reportar avistamiento" in report detail

**Files:**

- Modify: `app/(app)/reports/[id].tsx`
- Test: `src/__tests__/report-detail-screen.test.tsx`

**Interfaces:**

- Consumes: `useGuestGate()` (Task 3).

- [ ] **Step 1: Write the failing test**

In `src/__tests__/report-detail-screen.test.tsx`, update the `beforeEach` to guard against `isGuest` leaking between tests:

```tsx
beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.getState().setUser({ id: 'owner-1', name: 'Camila', email: 'c@test.com' });
  useAuthStore.setState({ isGuest: false });
});
```

Add a new test inside `describe('Detalle de reporte (Radar)', ...)`:

```tsx
it('modo invitado: "Reportar avistamiento" abre el modal de login', async () => {
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().enterGuestMode();
  mockedUseLostReportDetail.mockReturnValue({
    data: makeDetail(),
    isPending: false,
    isError: false,
  } as never);

  const { getByTestId } = render(<ReportDetailScreen />);
  await waitFor(() => expect(getByTestId('report.detail.reportSighting')).toBeTruthy());

  fireEvent.press(getByTestId('report.detail.reportSighting'));

  expect(getByTestId('authRequiredModal.signIn')).toBeTruthy();
  expect(mockPush).not.toHaveBeenCalledWith('/(app)/reports/report-1/sighting');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/report-detail-screen.test.tsx`
Expected: FAIL — `Unable to find an element with testID: authRequiredModal.signIn`.

- [ ] **Step 3: Write minimal implementation**

In `app/(app)/reports/[id].tsx`, add the import alongside the other hook/store imports:

```tsx
import { useAuthStore } from '../../../src/stores/authStore';
import { useGuestGate } from '../../../src/hooks/useGuestGate';
```

Inside `ReportDetailScreen`, add near the other top-level hook calls (e.g. right after `const currentLocation = ...`):

```tsx
const { requireAuth, GuestGateModal } = useGuestGate();
```

Change the "Reportar avistamiento" button's `onPress`:

```tsx
              <Pressable
                accessibilityRole="button"
                onPress={onReportSighting}
                style={[styles.primaryOrange, (isResolved || isArchived) && styles.disabled]}
                testID="report.detail.reportSighting"
                disabled={isResolved || isArchived}
              >
```

to:

```tsx
              <Pressable
                accessibilityRole="button"
                onPress={() => requireAuth(onReportSighting)}
                style={[styles.primaryOrange, (isResolved || isArchived) && styles.disabled]}
                testID="report.detail.reportSighting"
                disabled={isResolved || isArchived}
              >
```

Add `<GuestGateModal />` right after `</ScrollView>` and before the screen's closing `</SafeAreaView>`:

```tsx
      </ScrollView>
      <GuestGateModal />
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/report-detail-screen.test.tsx`
Expected: PASS (all existing tests plus the new one).

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/reports/[id].tsx" src/__tests__/report-detail-screen.test.tsx
git commit -m "$(cat <<'EOF'
feat: gate sighting report action for guests

EOF
)"
```

---

### Task 8: Defensive guest redirect on report edit

**Files:**

- Modify: `app/(app)/reports/[id]/edit.tsx`
- Test: `src/__tests__/report-edit-screen.test.tsx`

**Interfaces:**

- Consumes: `useAuthStore` (Task 1). This screen is unreachable for guests through normal UI (only the report owner ever sees the "Editar reporte" button, and a guest is never the owner) — this is a defensive guard against direct deep-links, per the spec's explicit integration-point list.

- [ ] **Step 1: Write the failing test**

In `src/__tests__/report-edit-screen.test.tsx`, add `import { useAuthStore } from '../stores/authStore';` to the imports. Add a new test inside the existing top-level `describe` block:

```tsx
it('modo invitado: redirige hacia atrás al entrar (defensivo)', async () => {
  useAuthStore.setState({ isGuest: true });
  mockedUseLostReportDetail.mockReturnValue({
    data: makeDetail(),
    isPending: false,
    isError: false,
  } as never);
  mockedUseUpdateLostReportMutation.mockReturnValue({ mutateAsync: jest.fn() } as never);

  render(<ReportEditScreen />);

  await waitFor(() => expect(mockBack).toHaveBeenCalled());

  useAuthStore.setState({ isGuest: false });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/report-edit-screen.test.tsx`
Expected: FAIL — `mockBack` was never called.

- [ ] **Step 3: Write minimal implementation**

In `app/(app)/reports/[id]/edit.tsx`, change the React import:

```tsx
import React, { useCallback, useState } from 'react';
```

to:

```tsx
import React, { useCallback, useEffect, useState } from 'react';
```

Add the store import alongside the existing ones:

```tsx
import {
  useLostReportDetail,
  useUpdateLostReportMutation,
} from '../../../../src/hooks/useLostReports';
import { useAuthStore } from '../../../../src/stores/authStore';
```

Inside `ReportEditScreen`, right after `const reportId = id ?? '';`, add:

```tsx
const isGuest = useAuthStore((s) => s.isGuest);

useEffect((): void => {
  if (isGuest) {
    router.back();
  }
}, [isGuest, router]);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/report-edit-screen.test.tsx`
Expected: PASS (all existing tests plus the new one).

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/reports/[id]/edit.tsx" src/__tests__/report-edit-screen.test.tsx
git commit -m "$(cat <<'EOF'
fix: redirect guests away from report edit screen

EOF
)"
```

---

### Task 9: Gate booking submit in `services/[categoryId]/book.tsx`

**Files:**

- Modify: `app/(app)/services/[categoryId]/book.tsx`
- Test: `src/__tests__/services-book-screen.test.tsx`

**Interfaces:**

- Consumes: `useGuestGate()` (Task 3).

- [ ] **Step 1: Write the failing test**

In `src/__tests__/services-book-screen.test.tsx`, add `import { useAuthStore } from '../stores/authStore';` to the imports. Add a new test inside `describe('Solicitar servicio (§6.3)', ...)`:

```tsx
it('modo invitado: el envío abre el modal de login en vez de crear la reserva', async () => {
  useAuthStore.setState({ isGuest: true });
  mockedUseServiceDetail.mockReturnValue({ data: groomingDetail() } as never);

  const { getByTestId } = render(<BookServiceScreen />);
  await waitFor(() => expect(getByTestId('services.book.pet.pet_1')).toBeTruthy());

  fireEvent.press(getByTestId('services.book.pet.pet_1'));
  fireEvent.press(getByTestId('services.book.slots.slot.2026-07-10T15:00:00.000Z'));
  fireEvent.press(getByTestId('services.book.submit'));

  expect(mutateAsync).not.toHaveBeenCalled();
  expect(getByTestId('authRequiredModal.signIn')).toBeTruthy();

  useAuthStore.setState({ isGuest: false });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/services-book-screen.test.tsx`
Expected: FAIL — `Unable to find an element with testID: authRequiredModal.signIn`.

- [ ] **Step 3: Write minimal implementation**

In `app/(app)/services/[categoryId]/book.tsx`, add the import:

```tsx
import { SlotPicker } from '../../../../src/components/services/SlotPicker';
import type { KibbleProduct } from '../../../../src/domain/services';
import { useGuestGate } from '../../../../src/hooks/useGuestGate';
```

Inside `BookServiceScreen`, right after `const createBooking = useCreateBookingMutation();`, add:

```tsx
const { requireAuth, GuestGateModal } = useGuestGate();
```

Change the submit button's `onPress`:

```tsx
          <Pressable
            disabled={!canSubmit}
            onPress={(): void => void onSubmit()}
            style={[styles.ctaButton, !canSubmit ? styles.ctaButtonDisabled : null]}
            testID="services.book.submit"
          >
```

to:

```tsx
          <Pressable
            disabled={!canSubmit}
            onPress={(): void => requireAuth(() => void onSubmit())}
            style={[styles.ctaButton, !canSubmit ? styles.ctaButtonDisabled : null]}
            testID="services.book.submit"
          >
```

Add `<GuestGateModal />` right after the closing `)}` of the `{!detail ? (...) : (<ScrollView>...</ScrollView>)}` ternary, before `</SafeAreaView>`:

```tsx
        </ScrollView>
      )}
      <GuestGateModal />
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/services-book-screen.test.tsx`
Expected: PASS (all existing tests plus the new one).

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/services/[categoryId]/book.tsx" src/__tests__/services-book-screen.test.tsx
git commit -m "$(cat <<'EOF'
feat: gate booking submit for guests

EOF
)"
```

---

### Task 10: Gate "Mis reservas" entry in Servicios catalog

**Files:**

- Modify: `app/(app)/services.tsx`
- Test: `src/__tests__/services-catalog-screen.test.tsx`

**Interfaces:**

- Consumes: `useGuestGate()` (Task 3). `app/(app)/services/bookings.tsx` itself needs no changes — it is only reachable through this one link.

- [ ] **Step 1: Write the failing test**

In `src/__tests__/services-catalog-screen.test.tsx`, add `import { useAuthStore } from '../stores/authStore';` to the imports. Add a new test inside `describe('Catálogo de servicios (Radar §6.1)', ...)`:

```tsx
it('modo invitado: "Mis reservas" abre el modal de login en vez de navegar', () => {
  useAuthStore.setState({ isGuest: true });
  mockedUseServiceCatalog.mockReturnValue({
    data: [],
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  } as never);

  const { getByTestId } = render(<ServicesScreen />);
  fireEvent.press(getByTestId('services.myBookings'));

  expect(mockPush).not.toHaveBeenCalledWith('/(app)/services/bookings');
  expect(getByTestId('authRequiredModal.signIn')).toBeTruthy();

  useAuthStore.setState({ isGuest: false });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/services-catalog-screen.test.tsx`
Expected: FAIL — `Unable to find an element with testID: authRequiredModal.signIn`.

- [ ] **Step 3: Write minimal implementation**

In `app/(app)/services.tsx`, add the import:

```tsx
import { useServiceCatalog } from '../../src/hooks/useServices';
import { CATEGORY_ICONS } from '../../src/domain/services';
import type { ServiceCategory } from '../../src/domain/services';
import { useGuestGate } from '../../src/hooks/useGuestGate';
```

Inside `ServicesScreen`, right after `const categories = data ?? [];`, add:

```tsx
const { requireAuth, GuestGateModal } = useGuestGate();
```

Change the "Mis reservas" button's `onPress`:

```tsx
        <Pressable
          onPress={(): void => router.push('/(app)/services/bookings')}
          testID="services.myBookings"
          style={styles.myBookingsLink}
        >
```

to:

```tsx
        <Pressable
          onPress={(): void => requireAuth(() => router.push('/(app)/services/bookings'))}
          testID="services.myBookings"
          style={styles.myBookingsLink}
        >
```

Add `<GuestGateModal />` right before the screen's closing `</SafeAreaView>`:

```tsx
      )}
      <GuestGateModal />
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/services-catalog-screen.test.tsx`
Expected: PASS (all existing tests plus the new one).

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/services.tsx" src/__tests__/services-catalog-screen.test.tsx
git commit -m "$(cat <<'EOF'
feat: gate my-bookings entry for guests

EOF
)"
```

---

### Task 11: Full-suite verification

**Files:**

- None modified — verification only.

**Interfaces:**

- None.

- [ ] **Step 1: Run the full TypeScript check**

Run: `npx tsc --noEmit -p .`
Expected: Exactly the same pre-existing 36 errors, in exactly the same 6 files as before this plan (`app/(app)/profile/settings.tsx`, `src/__tests__/home-map-screen.test.tsx`, `src/components/errors/GlobalErrorBoundary.tsx`, `src/components/skeleton/Skeleton.tsx`, `src/hooks/useReverseGeocodeLabel.ts`, `src/services/usersService.ts`). No errors in any file touched by this plan.

- [ ] **Step 2: Run the full Jest suite**

Run: `npx jest --silent`
Expected: The same 3 pre-existing failing suites as before this plan (navigation-container issue in `huellitas-map.test.tsx`, `Location.getBackgroundPermissionsAsync` issues in 2 other suites) — no new failures. All new guest-mode tests (Tasks 1–10) pass.

- [ ] **Step 3: If either check regressed, fix before continuing**

If `tsc` shows a new error, or `jest` shows a new failing suite/test beyond the known baseline, stop and fix it in the task that introduced it — do not proceed to a final commit with a regression.

- [ ] **Step 4: No commit for this task**

This task is verification-only; nothing is staged or committed here. If Step 3 required a fix, that fix was already committed as part of amending the relevant task's own commit step.
