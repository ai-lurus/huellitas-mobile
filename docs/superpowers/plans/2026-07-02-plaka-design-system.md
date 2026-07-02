# PLAKA Design System — Foundation + Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `src/design/tokens.ts` around the PLAKA brand palette and Montserrat/Inter typography, wire real font loading, and migrate `AppTabBar` (the footer) to a responsive floating/full-bar layout as the first component built on the new system.

**Architecture:** All changes flow through the existing `src/design/tokens.ts` single source of truth (colors + typography), a new `src/design/breakpoints.ts` for the responsive rule, and a new `src/hooks/useAppFonts.ts` that isolates font-loading logic so it's unit-testable outside the heavy `app/_layout.tsx` provider tree. `AppTabBar` is rewritten to read the breakpoint and the new token names; all other ~48 files that already import `colors`/`typography` inherit the new values automatically without being touched.

**Tech Stack:** Expo 54 / React Native 0.81, expo-router, `@expo-google-fonts/montserrat` + `@expo-google-fonts/inter` (new deps) via `expo-font` (already installed), Jest + `@testing-library/react-native` v13, `jest-expo` preset (already whitelists `@expo-google-fonts/.*` in `transformIgnorePatterns`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-02-plaka-design-system-design.md`.
- Only touch: `src/design/tokens.ts`, `src/design/breakpoints.ts` (new), `src/hooks/useAppFonts.ts` (new), `app/_layout.tsx`, `src/components/navigation/AppTabBar.tsx`, `app.json`, `app/(app)/index.tsx`, `package.json`, plus their test files. No other consuming file is edited.
- Color/typography token **key names** in `tokens.ts` do not change, only values — every other file keeps working unmodified.
- `colors.accent` and `colors.success` (and `successIcon`) must resolve to `#00785B` (legible darkened mint), **not** raw `#00F0B5` — raw mint is not assigned to any exported token in this plan, per the contrast finding in the spec.
- `colors.danger` stays raw coral `#FF4B4B`; `colors.dangerDark` (existing key) is `#C62828` for text use.
- Footer floating breakpoint is exactly `400` (pt), defined once in `src/design/breakpoints.ts` as `BREAKPOINT_TABLET`.
- App rename touches only `app.json`'s `expo.name` and the two "Huellitas" strings in `app/(app)/index.tsx` (lines ~114 and ~120). No slug/bundleIdentifier/scheme/component-name changes.
- Commit message subjects must be lower-case (repo's commitlint `subject-case` rule rejects capitalized subjects).
- Coverage threshold is global 80% (branches/functions/lines/statements) per `jest.config.js` — new files must be meaningfully tested, not just present.

---

## Task 1: Rewrite color tokens with the PLAKA palette

**Files:**

- Modify: `src/design/tokens.ts` (the `colors` export only, lines 3–29 in the current file)
- Test: `src/design/tokens.test.ts` (new)

**Interfaces:**

- Produces: `colors.primary`, `colors.primaryDark`, `colors.accent`, `colors.danger`, `colors.dangerDark`, `colors.dangerSoft`, `colors.dangerIcon`, `colors.success`, `colors.successIcon`, `colors.textPrimary`, `colors.textSecondary`, `colors.textMuted`, `colors.border`, `colors.background`, `colors.backgroundApp`, `colors.surface`, `colors.navActive`, `colors.google`, `colors.iconMuted`, `colors.infoBorder`, `colors.infoBackground`, `colors.white`, `colors.black` — all pre-existing key names, new values. No key is added or removed.

- [ ] **Step 1: Write the failing test**

Create `src/design/tokens.test.ts`:

```ts
import { colors } from './tokens';

describe('design tokens — colors', () => {
  it('uses the PLAKA brand colors for primary/surface/accent/danger', () => {
    expect(colors.primary).toBe('#0B5369');
    expect(colors.surface).toBe('#FFFFFF');
    expect(colors.accent).toBe('#00785B');
    expect(colors.danger).toBe('#FF4B4B');
  });

  it('derives supporting colors from the brand palette', () => {
    expect(colors.primaryDark).toBe('#083E4D');
    expect(colors.dangerDark).toBe('#C62828');
    expect(colors.dangerSoft).toBe('#FFEDED');
    expect(colors.dangerIcon).toBe('#D32F2F');
    expect(colors.success).toBe('#00785B');
    expect(colors.successIcon).toBe('#00785B');
    expect(colors.textPrimary).toBe('#0F2933');
    expect(colors.textSecondary).toBe('#5C7480');
    expect(colors.textMuted).toBe('rgba(15,41,51,0.42)');
    expect(colors.border).toBe('#DCE6E9');
    expect(colors.background).toBe('#F6FAFA');
    expect(colors.backgroundApp).toBe('#F6FAFA');
    expect(colors.navActive).toBe('#0B5369');
    expect(colors.iconMuted).toBe('#5C7480');
    expect(colors.infoBorder).toBe('#0B5369');
    expect(colors.infoBackground).toBe('rgba(11,83,105,0.06)');
  });

  it('keeps non-brand colors unchanged', () => {
    expect(colors.google).toBe('#4285F4');
    expect(colors.white).toBe('#FFFFFF');
    expect(colors.black).toBe('#000000');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/design/tokens.test.ts`
Expected: FAIL — `colors.primary` is currently `#5E72E4`, not `#0B5369` (and `colors.primaryDark` is `undefined`).

- [ ] **Step 3: Replace the `colors` export in `src/design/tokens.ts`**

Replace lines 3–29 (the whole `export const colors = { ... } as const;` block) with:

```ts
export const colors = {
  background: '#F6FAFA',
  /** Fondo tipo app (Mis mascotas / home) */
  backgroundApp: '#F6FAFA',
  surface: '#FFFFFF',
  primary: '#0B5369',
  primaryDark: '#083E4D',
  /** Texto / acentos de navegación activa (Inicio, Alerta…) */
  navActive: '#0B5369',
  textPrimary: '#0F2933',
  textSecondary: '#5C7480',
  textMuted: 'rgba(15,41,51,0.42)',
  border: '#DCE6E9',
  danger: '#FF4B4B',
  dangerDark: '#C62828',
  dangerSoft: '#FFEDED',
  dangerIcon: '#D32F2F',
  success: '#00785B',
  successIcon: '#00785B',
  iconMuted: '#5C7480',
  google: '#4285F4',
  accent: '#00785B',
  /** Caja info límite mascotas */
  infoBorder: '#0B5369',
  infoBackground: 'rgba(11,83,105,0.06)',
  white: '#FFFFFF',
  black: '#000000',
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/design/tokens.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/design/tokens.ts src/design/tokens.test.ts
git commit -m "feat: switch color tokens to the plaka brand palette"
```

---

## Task 2: Add Montserrat/Inter font packages and wire `fontFamily` into typography tokens

**Files:**

- Modify: `package.json` (via `npx expo install`, not hand-edited)
- Modify: `src/design/tokens.ts` (the `typography` export only)
- Test: `src/design/tokens.test.ts` (extend, from Task 1)

**Interfaces:**

- Consumes: nothing new.
- Produces: `typography.title.fontFamily === 'Montserrat_700Bold'`, `typography.heading.fontFamily === 'Montserrat_700Bold'`, `typography.body.fontFamily === 'Inter_400Regular'`, `typography.bodyStrong.fontFamily === 'Inter_700Bold'`, `typography.label.fontFamily === 'Inter_700Bold'`, `typography.button.fontFamily === 'Inter_700Bold'`, `typography.caption.fontFamily === 'Inter_400Regular'`. Task 3's `useAppFonts` hook loads exactly these three font weights (`Montserrat_700Bold`, `Inter_400Regular`, `Inter_700Bold`) — no other weight is introduced, so nothing is bundled that isn't actually used by a token (YAGNI: the spec mentions Montserrat 600/700 and Inter 400/500/600/700 as available weights, but only 700 and 400/700 respectively are wired to tokens today, to avoid changing existing numeric `fontWeight` values on components this plan doesn't otherwise touch).

- [ ] **Step 1: Install the font packages**

Run: `npx expo install @expo-google-fonts/montserrat @expo-google-fonts/inter`
Expected: `package.json` and the lockfile gain two new dependencies at Expo-SDK-54-compatible versions.

- [ ] **Step 2: Write the failing test**

Append to `src/design/tokens.test.ts`:

```ts
import { colors, typography } from './tokens';
```

(replace the existing `import { colors } from './tokens';` line with the one above), then add:

```ts
describe('design tokens — typography', () => {
  it('maps title/heading to Montserrat and body styles to Inter', () => {
    expect(typography.title.fontFamily).toBe('Montserrat_700Bold');
    expect(typography.heading.fontFamily).toBe('Montserrat_700Bold');
    expect(typography.body.fontFamily).toBe('Inter_400Regular');
    expect(typography.bodyStrong.fontFamily).toBe('Inter_700Bold');
    expect(typography.label.fontFamily).toBe('Inter_700Bold');
    expect(typography.button.fontFamily).toBe('Inter_700Bold');
    expect(typography.caption.fontFamily).toBe('Inter_400Regular');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/design/tokens.test.ts`
Expected: FAIL — `typography.title.fontFamily` is currently `undefined`.

- [ ] **Step 4: Add `fontFamily` to the `typography` export in `src/design/tokens.ts`**

Replace the `export const typography = { ... } as const;` block with:

```ts
export const typography = {
  title: {
    fontSize: 26,
    fontWeight: '700' as TextStyle['fontWeight'],
    fontFamily: 'Montserrat_700Bold',
  },
  heading: {
    fontSize: 20,
    fontWeight: '700' as TextStyle['fontWeight'],
    fontFamily: 'Montserrat_700Bold',
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily: 'Inter_400Regular',
  },
  bodyStrong: {
    fontSize: 14,
    fontWeight: '700' as TextStyle['fontWeight'],
    fontFamily: 'Inter_700Bold',
  },
  label: {
    fontSize: 13,
    fontWeight: '700' as TextStyle['fontWeight'],
    fontFamily: 'Inter_700Bold',
  },
  button: {
    fontSize: 16,
    fontWeight: '700' as TextStyle['fontWeight'],
    fontFamily: 'Inter_700Bold',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily: 'Inter_400Regular',
  },
} as const;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/design/tokens.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/design/tokens.ts src/design/tokens.test.ts
git commit -m "feat: add montserrat and inter font families to typography tokens"
```

(If the project uses `yarn.lock` or `pnpm-lock.yaml` instead of `package-lock.json`, stage that lockfile instead — check `git status` output before staging.)

---

## Task 3: Add `useAppFonts` hook

**Files:**

- Create: `src/hooks/useAppFonts.ts`
- Test: `src/hooks/__tests__/useAppFonts.test.ts`

**Interfaces:**

- Consumes: `useFonts` from `expo-font`; `Montserrat_700Bold` from `@expo-google-fonts/montserrat`; `Inter_400Regular`, `Inter_700Bold` from `@expo-google-fonts/inter` (installed in Task 2).
- Produces: `useAppFonts(): boolean` — `true` once all three font weights have loaded, `false` while loading. Task 4 consumes this exact signature.

- [ ] **Step 1: Write the failing test**

Create `src/hooks/__tests__/useAppFonts.test.ts`:

```ts
import { renderHook } from '@testing-library/react-native';
import { useFonts } from 'expo-font';

import { useAppFonts } from '../useAppFonts';

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));
jest.mock('@expo-google-fonts/montserrat', () => ({ Montserrat_700Bold: 1 }));
jest.mock('@expo-google-fonts/inter', () => ({ Inter_400Regular: 2, Inter_700Bold: 3 }));

const mockUseFonts = jest.mocked(useFonts);

describe('useAppFonts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false while fonts are loading', () => {
    mockUseFonts.mockReturnValue([false, null]);

    const { result } = renderHook(() => useAppFonts());

    expect(result.current).toBe(false);
  });

  it('returns true once fonts finish loading', () => {
    mockUseFonts.mockReturnValue([true, null]);

    const { result } = renderHook(() => useAppFonts());

    expect(result.current).toBe(true);
  });

  it('requests exactly the three PLAKA font weights', () => {
    mockUseFonts.mockReturnValue([true, null]);

    renderHook(() => useAppFonts());

    expect(mockUseFonts).toHaveBeenCalledWith({
      Montserrat_700Bold: 1,
      Inter_400Regular: 2,
      Inter_700Bold: 3,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/hooks/__tests__/useAppFonts.test.ts`
Expected: FAIL with "Cannot find module '../useAppFonts'"

- [ ] **Step 3: Write the implementation**

Create `src/hooks/useAppFonts.ts`:

```ts
import { useFonts } from 'expo-font';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export function useAppFonts(): boolean {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Inter_400Regular,
    Inter_700Bold,
  });

  return fontsLoaded;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/hooks/__tests__/useAppFonts.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAppFonts.ts src/hooks/__tests__/useAppFonts.test.ts
git commit -m "feat: add useAppFonts hook for plaka font loading"
```

---

## Task 4: Gate `app/_layout.tsx` on font loading

**Files:**

- Modify: `app/_layout.tsx`

**Interfaces:**

- Consumes: `useAppFonts(): boolean` from Task 3 (`src/hooks/useAppFonts.ts`).

**Note on testing:** `app/_layout.tsx` has no existing test today — rendering it requires mocking Sentry, the persisted React Query client (AsyncStorage), i18n, deep-link handling, and several other providers that no test in this repo currently sets up. Building that harness from scratch is out of proportion to a one-line loading gate and out of the scope agreed in the spec (only the listed files change). This task is verified manually instead (Step 3 below) rather than via a new automated test — flagging this explicitly per plan-writing conventions rather than silently skipping it.

- [ ] **Step 1: Add the hook call and loading guard**

In `app/_layout.tsx`, add the import (alongside the other `src/...` imports near the top):

```ts
import { useAppFonts } from '../src/hooks/useAppFonts';
```

Then change the `RootLayout` function body from:

```tsx
export default function RootLayout(): React.JSX.Element {
  useEffect(() => {
    // Carga el idioma guardado (best-effort) al iniciar la app.
    void loadLanguage().then((lng) => {
      void i18n.changeLanguage(lng);
    });

    // Despierta la base de datos Neon (arranque en frío) en segundo plano
    void httpClient.get('/health').catch(() => {});
  }, []);

  return (
```

to:

```tsx
export default function RootLayout(): React.JSX.Element {
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    // Carga el idioma guardado (best-effort) al iniciar la app.
    void loadLanguage().then((lng) => {
      void i18n.changeLanguage(lng);
    });

    // Despierta la base de datos Neon (arranque en frío) en segundo plano
    void httpClient.get('/health').catch(() => {});
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
```

(`useEffect` and the hooks above it must stay unconditional and above the `if` guard — React's rules of hooks forbid calling hooks after an early return.)

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `app/_layout.tsx`.

- [ ] **Step 3: Manual verification**

Run: `npx expo start`, open the app in a simulator/device, and confirm:

- The app still boots to the normal Stack navigator (no permanent blank screen).
- Title/heading text now visibly renders in Montserrat (bolder, more geometric than the system font) and body text in Inter.

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: gate root layout render on plaka font loading"
```

---

## Task 5: Add the footer breakpoint

**Files:**

- Create: `src/design/breakpoints.ts`
- Test: `src/design/breakpoints.test.ts`

**Interfaces:**

- Produces: `BREAKPOINT_TABLET: number` (`400`). Task 6 imports this exact name from this exact path.

- [ ] **Step 1: Write the failing test**

Create `src/design/breakpoints.test.ts`:

```ts
import { BREAKPOINT_TABLET } from './breakpoints';

describe('breakpoints', () => {
  it('defines the width at which the footer switches from full-bar to floating', () => {
    expect(BREAKPOINT_TABLET).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/design/breakpoints.test.ts`
Expected: FAIL with "Cannot find module './breakpoints'"

- [ ] **Step 3: Write the implementation**

Create `src/design/breakpoints.ts`:

```ts
/** Ancho (pt) a partir del cual el footer flota; por debajo, ocupa el ancho completo. */
export const BREAKPOINT_TABLET = 400;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/design/breakpoints.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add src/design/breakpoints.ts src/design/breakpoints.test.ts
git commit -m "feat: add tablet breakpoint for the responsive footer"
```

---

## Task 6: Make `AppTabBar` responsive (floating vs full-bar) and recolor it with PLAKA tokens

**Files:**

- Modify: `src/components/navigation/AppTabBar.tsx` (full rewrite of the file's content, same exported symbol)
- Test: `src/components/navigation/AppTabBar.test.tsx` (new)

**Interfaces:**

- Consumes: `colors`, `radius`, `shadows`, `spacing`, `typography` from `../../design/tokens` (Task 1/2); `BREAKPOINT_TABLET` from `../../design/breakpoints` (Task 5).
- Produces: `AppTabBar(props: BottomTabBarProps): React.ReactElement` — same signature as before, still the default tab bar renderer wired into the tab navigator elsewhere in the app (no navigator config changes needed).
- Behavior contract for later reference: width `< 400` → full-bar (edge-to-edge, top corners rounded, no `marginHorizontal`); width `>= 400` → floating (`marginHorizontal: 16`, full pill `borderRadius`). The `alerts` route's FAB and its label are always `colors.danger`, regardless of focus. Other tabs: focused → `colors.primary`, unfocused → `colors.textSecondary`.

- [ ] **Step 1: Write the failing test**

Create `src/components/navigation/AppTabBar.test.tsx`:

```tsx
import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { AppTabBar } from './AppTabBar';
import { colors } from '../../design/tokens';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props: Record<string, unknown>) =>
    jest.requireActual('react').createElement('Ionicons', props),
}));

jest.mock(
  '@expo/vector-icons/FontAwesome5',
  () => (props: Record<string, unknown>) =>
    jest.requireActual('react').createElement('FontAwesome5', props),
);

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return { ...actual, useWindowDimensions: jest.fn() };
});

const mockUseWindowDimensions = jest.mocked(useWindowDimensions);

const TITLES: Record<string, string> = {
  index: 'Inicio',
  map: 'Radar',
  alerts: 'Reportar',
  pets: 'Mascotas',
  profile: 'Comunidad',
};

function buildProps(
  overrides: Partial<{ routeNames: string[]; index: number }> = {},
): BottomTabBarProps & { navigation: { emit: jest.Mock; navigate: jest.Mock } } {
  const routeNames = overrides.routeNames ?? ['index', 'map', 'alerts', 'pets', 'profile'];
  const routes = routeNames.map((name) => ({ key: name, name }));
  const descriptors = Object.fromEntries(
    routes.map((route) => [route.key, { options: { title: TITLES[route.name] } }]),
  );

  return {
    state: { routes, index: overrides.index ?? 0 },
    descriptors,
    navigation: {
      emit: jest.fn().mockReturnValue({ defaultPrevented: false }),
      navigate: jest.fn(),
    },
  } as unknown as BottomTabBarProps & { navigation: { emit: jest.Mock; navigate: jest.Mock } };
}

describe('AppTabBar', () => {
  beforeEach(() => {
    mockUseWindowDimensions.mockReturnValue({
      width: 375,
      height: 812,
      scale: 2,
      fontScale: 1,
    });
  });

  it('renders full-bar style on screens narrower than 400pt', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 375, height: 812, scale: 2, fontScale: 1 });
    const { getByTestId } = render(<AppTabBar {...buildProps()} />);

    const flat = StyleSheet.flatten(getByTestId('appTabBar.wrap').props.style);

    expect(flat.marginHorizontal).toBeUndefined();
    expect(flat.borderTopLeftRadius).toBeDefined();
  });

  it('renders floating style on screens 400pt or wider', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 420, height: 900, scale: 2, fontScale: 1 });
    const { getByTestId } = render(<AppTabBar {...buildProps()} />);

    const flat = StyleSheet.flatten(getByTestId('appTabBar.wrap').props.style);

    expect(flat.marginHorizontal).toBe(16);
    expect(flat.borderRadius).toBeDefined();
  });

  it('keeps the alert FAB coral regardless of focus state', () => {
    const focused = render(<AppTabBar {...buildProps({ index: 2 })} />);
    expect(StyleSheet.flatten(focused.getByTestId('tab.alert').props.style).backgroundColor).toBe(
      colors.danger,
    );
    focused.unmount();

    const unfocused = render(<AppTabBar {...buildProps({ index: 0 })} />);
    expect(StyleSheet.flatten(unfocused.getByTestId('tab.alert').props.style).backgroundColor).toBe(
      colors.danger,
    );
  });

  it('renders the alert label in coral', () => {
    const { getByText } = render(<AppTabBar {...buildProps()} />);
    expect(StyleSheet.flatten(getByText('Reportar').props.style).color).toBe(colors.danger);
  });

  it('colors the focused tab with primary and other tabs with textSecondary', () => {
    const { getByText } = render(<AppTabBar {...buildProps({ index: 0 })} />);

    expect(StyleSheet.flatten(getByText('Inicio').props.style).color).toBe(colors.primary);
    expect(StyleSheet.flatten(getByText('Mascotas').props.style).color).toBe(colors.textSecondary);
  });

  it('shows filled/outline icons based on focus state', () => {
    const { UNSAFE_getByProps } = render(<AppTabBar {...buildProps({ index: 0 })} />);

    expect(UNSAFE_getByProps({ name: 'home' })).toBeTruthy();
    expect(UNSAFE_getByProps({ name: 'location-outline' })).toBeTruthy();
    expect(UNSAFE_getByProps({ name: 'person-outline' })).toBeTruthy();
    expect(UNSAFE_getByProps({ name: 'bone' })).toBeTruthy();
  });

  it('does not render nested routes', () => {
    const { queryByTestId } = render(
      <AppTabBar {...buildProps({ routeNames: ['index', 'profile/settings'] })} />,
    );

    expect(queryByTestId('tab.profile/settings')).toBeNull();
  });

  it('does not render routes outside the main tab set', () => {
    const { queryByTestId } = render(
      <AppTabBar {...buildProps({ routeNames: ['index', 'notifications'] })} />,
    );

    expect(queryByTestId('tab.notifications')).toBeNull();
  });

  it('navigates to a pressed, unfocused tab', () => {
    const props = buildProps({ index: 0 });
    const { getByTestId } = render(<AppTabBar {...props} />);

    fireEvent.press(getByTestId('tab.map'));

    expect(props.navigation.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'tabPress', target: 'map' }),
    );
    expect(props.navigation.navigate).toHaveBeenCalledWith('map');
  });

  it('does not navigate when the tabPress event is defaultPrevented', () => {
    const props = buildProps({ index: 0 });
    props.navigation.emit.mockReturnValue({ defaultPrevented: true });
    const { getByTestId } = render(<AppTabBar {...props} />);

    fireEvent.press(getByTestId('tab.map'));

    expect(props.navigation.navigate).not.toHaveBeenCalled();
  });

  it('does not navigate when pressing the already-focused tab', () => {
    const props = buildProps({ index: 0 });
    const { getByTestId } = render(<AppTabBar {...props} />);

    fireEvent.press(getByTestId('tab.index'));

    expect(props.navigation.navigate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/navigation/AppTabBar.test.tsx`
Expected: FAIL — `getByTestId('appTabBar.wrap')` not found (no such testID yet), and the floating-style/coral-FAB/primary-color assertions fail against the current implementation.

- [ ] **Step 3: Rewrite `src/components/navigation/AppTabBar.tsx`**

Replace the entire file with:

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import { BREAKPOINT_TABLET } from '../../design/breakpoints';

const TAB_ICON = 22;
const ALERT_BUTTON_SIZE = 56;
const FLOATING_MARGIN = 16;
const TAB_ROUTES = new Set(['index', 'map', 'alerts', 'pets', 'profile']);

export function AppTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isFloating = width >= BREAKPOINT_TABLET;

  return (
    <View
      testID="appTabBar.wrap"
      style={[
        styles.wrap,
        isFloating ? styles.wrapFloating : styles.wrapFullBar,
        isFloating
          ? { marginBottom: Math.max(insets.bottom, FLOATING_MARGIN) }
          : { paddingBottom: Math.max(insets.bottom, spacing.sm) },
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          // Evita duplicados cuando hay rutas anidadas (p. ej. profile/settings)
          if (route.name.includes('/')) {
            return null;
          }
          // Solo renderiza las tabs principales (evita rutas extra como `notifications`)
          if (!TAB_ROUTES.has(route.name)) {
            return null;
          }
          const { options } = descriptors[route.key];
          const label =
            options.title != null && String(options.title).length > 0
              ? String(options.title)
              : route.name;
          const isFocused = state.index === index;
          const color = isFocused ? colors.primary : colors.textSecondary;

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

          if (route.name === 'alerts') {
            return (
              <View key={route.key} style={styles.alertSlot}>
                <Pressable
                  testID="tab.alert"
                  accessibilityRole="button"
                  accessibilityState={{ selected: isFocused }}
                  accessibilityLabel={label}
                  onPress={onPress}
                  style={styles.alertFab}
                >
                  <Ionicons name="notifications" size={26} color={colors.white} />
                </Pressable>
                <Text style={styles.alertLabel}>{label}</Text>
              </View>
            );
          }

          let icon: React.ReactNode = (
            <Ionicons name="ellipse-outline" size={TAB_ICON} color={color} />
          );
          if (route.name === 'index') {
            icon = (
              <Ionicons name={isFocused ? 'home' : 'home-outline'} size={TAB_ICON} color={color} />
            );
          } else if (route.name === 'map') {
            icon = (
              <Ionicons
                name={isFocused ? 'location' : 'location-outline'}
                size={TAB_ICON}
                color={color}
              />
            );
          } else if (route.name === 'pets') {
            icon = <FontAwesome5 name="bone" size={20} color={color} />;
          } else if (route.name === 'profile') {
            icon = (
              <Ionicons
                name={isFocused ? 'person' : 'person-outline'}
                size={TAB_ICON}
                color={color}
              />
            );
          }

          return (
            <Pressable
              key={route.key}
              testID={`tab.${route.name}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              onPress={onPress}
              style={styles.tab}
            >
              {icon}
              <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadows.md,
  },
  wrapFullBar: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  wrapFloating: {
    marginHorizontal: FLOATING_MARGIN,
    borderRadius: radius.full,
    borderTopWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    minHeight: 52,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xxs,
    gap: spacing.xxs,
  },
  tabLabel: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  alertSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -28,
    paddingBottom: spacing.xxs,
  },
  alertLabel: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
    color: colors.danger,
  },
  alertFab: {
    width: ALERT_BUTTON_SIZE,
    height: ALERT_BUTTON_SIZE,
    borderRadius: ALERT_BUTTON_SIZE / 2,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    shadowColor: colors.danger,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/navigation/AppTabBar.test.tsx`
Expected: PASS (11 tests)

- [ ] **Step 5: Run the full test suite to check for regressions**

Run: `npx jest`
Expected: PASS — no other test imports raw hex values from `AppTabBar` or asserts the old `colors.navActive`-driven FAB color.

- [ ] **Step 6: Commit**

```bash
git add src/components/navigation/AppTabBar.tsx src/components/navigation/AppTabBar.test.tsx
git commit -m "feat: make the footer responsive and recolor it with plaka tokens"
```

---

## Task 7: Rename the visible app name to "PLAKA"

**Files:**

- Modify: `app.json` (line 3, `expo.name`)
- Modify: `app/(app)/index.tsx` (lines ~114 and ~120)

**Interfaces:** none (leaf UI text change).

**Note on testing:** `app/(app)/index.tsx` is the home feed screen and has no existing test file; it depends on feed/post/like hooks that aren't mocked anywhere yet. Building that mocking infrastructure from scratch for a two-string text change is disproportionate and out of the scope agreed in the spec. This task is verified manually (Step 3) instead of via a new test file, consistent with the same tradeoff made in Task 4.

- [ ] **Step 1: Update `app.json`**

Change:

```json
    "name": "Huellitas",
```

to:

```json
    "name": "PLAKA",
```

(Leave `slug`, `scheme`, `ios.bundleIdentifier`, `android.package`, and everything else untouched.)

- [ ] **Step 2: Update the brand text in `app/(app)/index.tsx`**

Change:

```tsx
          <Image
            accessibilityLabel="Huellitas"
            source={require('../../assets/icon.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.brandText}>Huellitas</Text>
```

to:

```tsx
          <Image
            accessibilityLabel="PLAKA"
            source={require('../../assets/icon.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.brandText}>PLAKA</Text>
```

- [ ] **Step 3: Manual verification**

Run: `npx expo start`, open the app on a simulator/device, sign in, and confirm the home screen header shows "PLAKA" instead of "Huellitas". Also check the OS-level app name (springboard/launcher label or the Expo Go / dev-client app switcher entry) reads "PLAKA".

- [ ] **Step 4: Commit**

```bash
git add app.json "app/(app)/index.tsx"
git commit -m "feat: rename visible app name to plaka"
```

---

## Final check

- [ ] Run the full suite once more end to end: `npx jest --coverage` — confirm the global coverage thresholds (80% branches/functions/lines/statements) still pass and no unrelated test broke.
- [ ] Run `npx tsc --noEmit` — confirm no new type errors.
- [ ] Grep for any remaining raw `#00F0B5` or `#0B5369`-adjacent literal outside `tokens.ts` that should have picked up the token instead (`grep -rn "#00F0B5" src app`) — expected: no matches, since the plan never introduces a new raw-mint literal outside the token file.
