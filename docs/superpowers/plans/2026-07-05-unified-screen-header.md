# Unified Screen Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ~30 ad-hoc, inconsistent screen headers in `huellitas-mobile` with one shared `ScreenHeader` component, so every screen in the authenticated area has a consistent header.

**Architecture:** One new component, `src/components/navigation/ScreenHeader.tsx`, with two visual modes selected by whether `onBack` is passed: "root" (brand logo + title, for tab-root screens) and "detail" (back circle + centered title, for everything else). Each in-scope screen is migrated in its own task: remove its bespoke header JSX/styles, import `ScreenHeader`, render it with that screen's real title/back/right-action data preserved exactly as today.

**Tech Stack:** React Native, Expo Router, TypeScript, `react-native-safe-area-context`, `@expo/vector-icons`, Jest + `@testing-library/react-native`.

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-07-05-unified-screen-header-design.md` — every task's requirements implicitly include it.
- `ScreenHeader` owns its own top safe-area padding (`useSafeAreaInsets` + `spacing.sm`). Any screen that wraps its whole body in `<SafeAreaView edges={['top']}>` must be changed to a plain `<View>` (same `style`) once `ScreenHeader` is in place, to avoid double top-padding. Screens that used a hardcoded `paddingTop: spacing.xxxl` guess on their own header row lose that guess entirely — `ScreenHeader` replaces it with a real inset.
- No new tests are added per migrated screen (this is a visual/structural refactor, not new behavior). Where a screen already has a dedicated test file, run it after the change to confirm no regression. Every task also runs `npx tsc --noEmit` from `huellitas-mobile/`.
- Preserve every existing literal string, dynamic title expression, `testID`, and navigation callback exactly — only the header's markup/styling changes.
- Out of scope (do not touch): `app/(app)/index.tsx` (`HomeHeader`), `app/(app)/pets/[id].tsx` (`PetProfileHeader`), `app/(app)/reports/[id].tsx` (photo-hero header), `src/components/groups/GroupHeader.tsx` (kept, still used inside `groups/[id].tsx`'s list header), the 4 success/confetti screens (`reports/success(.web).tsx`, `reports/[id]/found-success(.web).tsx`), and all `app/(auth)/**` screens.
- Commit message prefix: `refactor:` for every task in this plan (each is a pure header refactor, no behavior change) except Task 15 and Task 18, which are `fix:` (they add a missing back button / missing header where none existed).

---

### Task 1: `ScreenHeader` component

**Files:**

- Create: `src/components/navigation/ScreenHeader.tsx`
- Test: `src/__tests__/screen-header.test.tsx`

**Interfaces:**

- Produces: `ScreenHeader` component, `ScreenHeaderProps`:

  ```ts
  export interface ScreenHeaderProps {
    title: string;
    onBack?: () => void;
    rightSlot?: React.ReactNode;
    testID?: string; // default 'screenHeader'
  }
  ```

  Rendering rule every later task relies on: if `onBack` is provided → "detail" mode (back circle + centered title + `rightSlot` or a 40px spacer). If `onBack` is omitted → "root" mode (brand logo + left-aligned title + `rightSlot`). Back button testID is `${testID}.back`, title testID is `${testID}.title`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/screen-header.test.tsx
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

import { ScreenHeader } from '../components/navigation/ScreenHeader';

describe('ScreenHeader', () => {
  it('modo root: sin onBack, no muestra botón de volver y renderiza rightSlot', () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <ScreenHeader
        title="Mis mascotas"
        rightSlot={<Text testID="root.action">Acción</Text>}
        testID="header"
      />,
    );

    expect(getByText('Mis mascotas')).toBeTruthy();
    expect(queryByTestId('header.back')).toBeNull();
    expect(getByTestId('root.action')).toBeTruthy();
  });

  it('modo detail: con onBack, el botón de volver lo invoca al presionarlo', () => {
    const onBack = jest.fn();
    const { getByTestId } = render(
      <ScreenHeader title="Editar mascota" onBack={onBack} testID="header" />,
    );

    fireEvent.press(getByTestId('header.back'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(getByTestId('header.title').props.children).toBe('Editar mascota');
  });

  it('modo detail: sin rightSlot, no rompe el layout (spacer implícito)', () => {
    const { queryByTestId } = render(
      <ScreenHeader title="Notificaciones" onBack={jest.fn()} testID="header" />,
    );
    expect(queryByTestId('header.rightSlot')).toBeNull();
  });

  it('modo detail: con rightSlot, lo renderiza en vez del spacer', () => {
    const { getByTestId } = render(
      <ScreenHeader
        title="Reporte de avistamiento"
        onBack={jest.fn()}
        rightSlot={<Text testID="detail.action">Enviar</Text>}
        testID="header"
      />,
    );
    expect(getByTestId('detail.action')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `huellitas-mobile/`): `npx jest src/__tests__/screen-header.test.tsx`
Expected: FAIL — `Cannot find module '../components/navigation/ScreenHeader'`

- [ ] **Step 3: Write the component**

```tsx
// src/components/navigation/ScreenHeader.tsx
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '../../design/tokens';

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  testID?: string;
}

export function ScreenHeader({
  title,
  onBack,
  rightSlot,
  testID = 'screenHeader',
}: ScreenHeaderProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top + spacing.sm;

  if (!onBack) {
    return (
      <View style={[styles.rootRow, { paddingTop }]} testID={testID}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Image
              accessibilityLabel="Huellitas"
              source={require('../../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.rootTitle} numberOfLines={1} testID={`${testID}.title`}>
            {title}
          </Text>
        </View>
        {rightSlot ? (
          <View style={styles.rightSlot} testID={`${testID}.rightSlot`}>
            {rightSlot}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.detailRow, { paddingTop }]} testID={testID}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={onBack}
        style={styles.backCircle}
        testID={`${testID}.back`}
      >
        <Ionicons name="chevron-back" size={22} color={colors.white} />
      </Pressable>
      <Text style={styles.detailTitle} numberOfLines={1} testID={`${testID}.title`}>
        {title}
      </Text>
      {rightSlot ? (
        <View style={styles.rightSlot} testID={`${testID}.rightSlot`}>
          {rightSlot}
        </View>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFB366',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: 28, height: 28 },
  rootTitle: { ...typography.bodyStrong, color: colors.textPrimary, flexShrink: 1 },
  rightSlot: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: { ...typography.heading, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  spacer: { width: 40 },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/screen-header.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/navigation/ScreenHeader.tsx src/__tests__/screen-header.test.tsx
git commit -m "feat: add shared ScreenHeader component for root and detail screens"
```

---

### Task 2: `pets/index.tsx` → root header

**Files:**

- Modify: `app/(app)/pets/index.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1 (`title`, `rightSlot`).

Current header (verified):

```tsx
<SafeAreaView style={styles.safe} edges={['top']}>
  <View style={styles.headerRow}>
    <Text style={styles.title}>Mis mascotas</Text>
    <View style={styles.headerRight}>
      <View style={styles.avatar} testID="pets.userAvatar">
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
    </View>
  </View>
```

Styles to remove: `headerRow`, `title`, `headerRight` (keep `avatar`, `avatarText` — reused as `rightSlot` content). Change `SafeAreaView` → `View` (same `style={styles.safe}`, drop the now-unused `edges={['top']}` and the `SafeAreaView` import from `'react-native-safe-area-context'` if nothing else in the file uses it — check first).

- [ ] **Step 1: Edit the screen**

Replace:

```tsx
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mis mascotas</Text>
        <View style={styles.headerRight}>
          <View style={styles.avatar} testID="pets.userAvatar">
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        </View>
      </View>
```

with:

```tsx
    <View style={styles.safe}>
      <ScreenHeader
        title="Mis mascotas"
        rightSlot={
          <View style={styles.avatar} testID="pets.userAvatar">
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        }
      />
```

Update the matching closing tag from `</SafeAreaView>` to `</View>`. Add the import:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

Remove the `SafeAreaView` import from `'react-native-safe-area-context'` (confirm via `grep -n "SafeAreaView" "app/(app)/pets/index.tsx"` that no other usage remains before deleting the import). Remove `headerRow` and `headerRight` from the `StyleSheet.create` block; keep `title`'s definition only if still referenced elsewhere (it is not — remove it too); keep `avatar` and `avatarText`.

- [ ] **Step 2: Run the existing test file**

Run: `npx jest src/__tests__/pets-screens.test.tsx`
Expected: PASS (no assertions target the removed testIDs/styles).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/pets/index.tsx"
git commit -m "refactor: use ScreenHeader for pets list root screen"
```

---

### Task 3: `map.tsx` → root header

**Files:**

- Modify: `app/(app)/map.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines ~206-224):

```tsx
<View style={styles.screen}>
  <View style={styles.topBar}>
    <View style={styles.brand}>
      <View style={styles.logoMark}>
        <Image
          accessibilityLabel="Huellitas"
          resizeMode="contain"
          source={BRAND_LOGO}
          style={styles.logoImage}
        />
      </View>
      <Text style={styles.brandLabel}>Huellitas</Text>
    </View>
    <View style={styles.actions}>
      <Ionicons color={colors.textPrimary} name="search" size={20} />
      <Ionicons color={colors.textPrimary} name="notifications-outline" size={20} />
    </View>
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace the block above with:

```tsx
<View style={styles.screen}>
  <ScreenHeader
    title="Huellitas"
    rightSlot={
      <>
        <Ionicons color={colors.textPrimary} name="search" size={20} />
        <Ionicons color={colors.textPrimary} name="notifications-outline" size={20} />
      </>
    }
  />
```

Add the import:

```tsx
import { ScreenHeader } from '../../src/components/navigation/ScreenHeader';
```

Remove `topBar`, `brand`, `logoMark`, `logoImage`, `brandLabel`, `actions` from the `StyleSheet.create` block (all were header-only; confirm with `grep -n "styles\.\(topBar\|brand\|logoMark\|logoImage\|brandLabel\|actions\)\b" "app/(app)/map.tsx"` that none are used elsewhere in the file before deleting).

- [ ] **Step 2: Run the existing test file**

Run: `npx jest src/__tests__/home-map-screen.test.tsx`
Expected: PASS.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/map.tsx"
git commit -m "refactor: use ScreenHeader for map root screen"
```

---

### Task 4: `services.tsx` → root header

**Files:**

- Modify: `app/(app)/services.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified):

```tsx
<SafeAreaView style={styles.screen} edges={['top']} testID="services.screen">
  <View style={styles.headerRow}>
    <Text style={styles.title}>Servicios</Text>
    {/* "Mis reservas" oculto: ... */}
    {/* <Pressable ...> ... </Pressable> */}
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.screen} testID="services.screen">
  <ScreenHeader title="Servicios" />
  {/* "Mis reservas" oculto: el subsistema de bookings (GET/POST /api/v1/bookings)
      está fuera de alcance del spec de service-catalog y aún no existe en el backend.
      Reactivar cuando ese subsistema esté implementado. */}
  {/* <Pressable
    onPress={(): void => requireAuth(() => router.push('/(app)/services/bookings'))}
    testID="services.myBookings"
    style={styles.myBookingsLink}
  >
    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
    <Text style={styles.myBookingsText}>Mis reservas</Text>
  </Pressable> */}
```

(The commented-out block moves out from inside `styles.headerRow`'s `View` to be a direct sibling of `ScreenHeader` — it's dead code either way, keep it verbatim so it's easy to re-enable later.) Change the closing `</SafeAreaView>` to `</View>`. Add the import:

```tsx
import { ScreenHeader } from '../../src/components/navigation/ScreenHeader';
```

Remove the `SafeAreaView` import from `'react-native-safe-area-context'` (confirm no other usage first). Remove `headerRow` and `title` from `StyleSheet.create` (confirm unused elsewhere first); keep `myBookingsLink`/`myBookingsText` (still referenced by the commented-out Pressable, so leave them — don't remove styles that are merely unused-while-commented, only the ones made unused by this edit).

- [ ] **Step 2: Run the existing test file**

Run: `npx jest src/__tests__/services-catalog-screen.test.tsx`
Expected: PASS.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/services.tsx"
git commit -m "refactor: use ScreenHeader for services catalog root screen"
```

---

### Task 5: `profile/settings.tsx` → root header (showBack=false) and detail header (showBack=true)

**Files:**

- Modify: `app/(app)/profile/settings.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.
- This file backs both `profile/index.tsx` (`showBack={false}`, tab root) and any direct navigation with the default `showBack={true}` (detail screen, e.g. reached from a future "Ajustes" entry point) — both paths live in this one file/component, controlled by the existing `showBack` prop.

Current header (verified, lines 320-343):

```tsx
<View style={styles.header}>
  <View style={styles.brandRow} testID="settings.brand">
    <Image
      source={require('../../../assets/icon.png')}
      style={styles.brandLogo}
      accessibilityLabel="Huellitas"
      contentFit="contain"
    />
    <Text style={styles.brand}>Huellitas</Text>
  </View>
  {showBack ? (
    <Pressable
      accessibilityRole="button"
      testID="settings.back"
      onPress={() => router.back()}
      style={styles.backButton}
    >
      <Text style={styles.backText}>Volver</Text>
    </Pressable>
  ) : null}
</View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
{
  showBack ? (
    <ScreenHeader title="Ajustes" onBack={() => router.back()} testID="settings" />
  ) : (
    <ScreenHeader title="Huellitas" testID="settings" />
  );
}
```

Add the import:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

Remove `header`, `brandRow`, `brandLogo`, `brand`, `backButton`, `backText` from `StyleSheet.create` (confirm each is unused elsewhere in this large file with `grep -n "styles\.\(header\|brandRow\|brandLogo\|brand\|backButton\|backText\)\b" "app/(app)/profile/settings.tsx"` before deleting — this file is long, so check carefully).

- [ ] **Step 2: Run the existing test file**

Run: `npx jest src/__tests__/profile-settings-screen.test.tsx`
Expected: PASS (verified: this test file does not reference `testID="settings.back"` or `testID="settings.brand"`, so no test changes are needed).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/profile/settings.tsx"
git commit -m "refactor: use ScreenHeader for settings screen (root and detail modes)"
```

---

### Task 6: `notifications.tsx` → detail header with two-icon rightSlot

**Files:**

- Modify: `app/(app)/notifications.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 213-243):

```tsx
<SafeAreaView edges={['top']} style={styles.safe}>
  <View style={styles.header}>
    <Pressable
      accessibilityRole="button"
      onPress={() => router.back()}
      style={styles.backBtn}
      testID="notifications.back"
    >
      <Ionicons name="arrow-back" size={18} color={colors.primary} />
    </Pressable>
    <Text style={styles.headerTitle}>Notificaciones</Text>
    <View style={styles.headerRight}>
      <Pressable
        accessibilityRole="button"
        onPress={() => void markAllRead.mutateAsync().catch(() => {})}
        style={styles.iconBtn}
        testID="notifications.markAllRead"
      >
        <Ionicons name="checkmark" size={18} color={colors.success} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onClearAll}
        style={styles.iconBtn}
        testID="notifications.clearAll"
      >
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </Pressable>
    </View>
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.safe}>
  <ScreenHeader
    title="Notificaciones"
    onBack={() => router.back()}
    testID="notifications"
    rightSlot={
      <>
        <Pressable
          accessibilityRole="button"
          onPress={() => void markAllRead.mutateAsync().catch(() => {})}
          style={styles.iconBtn}
          testID="notifications.markAllRead"
        >
          <Ionicons name="checkmark" size={18} color={colors.success} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onClearAll}
          style={styles.iconBtn}
          testID="notifications.clearAll"
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </Pressable>
      </>
    }
  />
```

Change `<SafeAreaView edges={['top']} style={styles.safe}>` → `<View style={styles.safe}>` and the matching closing tag to `</View>`. Remove the `SafeAreaView` import (confirm no other usage first). Add:

```tsx
import { ScreenHeader } from '../../src/components/navigation/ScreenHeader';
```

Note: this changes the back button's testID from `notifications.back` to `notifications.back` (unchanged, `ScreenHeader` derives it as `${testID}.back`). Remove `header`, `backBtn`, `headerTitle`, `headerRight` from `StyleSheet.create` (confirm unused elsewhere first); keep `iconBtn`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file exists for `notifications.tsx` — confirmed via `ls src/__tests__/ | grep -i notif` returning nothing.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/notifications.tsx"
git commit -m "refactor: use ScreenHeader for notifications screen"
```

---

### Task 7: `pets/limit.tsx` → detail header

**Files:**

- Modify: `app/(app)/pets/limit.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 58-72):

```tsx
<SafeAreaView style={styles.safe} edges={['top']}>
  <View style={styles.topBar}>
    <Pressable
      testID="petLimit.back"
      onPress={() => router.back()}
      style={styles.backBtn}
      accessibilityRole="button"
      accessibilityLabel="Volver"
    >
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.topTitle}>Nueva mascota</Text>
    <View style={styles.backBtn} />
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.safe}>
  <ScreenHeader title="Nueva mascota" onBack={() => router.back()} testID="petLimit" />
```

Change `</SafeAreaView>` → `</View>`, remove the `SafeAreaView` import (confirm no other usage), add:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

This changes the back button testID from `petLimit.back` to `petLimit.back` (unchanged — matches `${testID}.back`). Remove `topBar`, `backBtn`, `topTitle` from `StyleSheet.create` (confirm unused elsewhere first).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `pets/limit.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/pets/limit.tsx"
git commit -m "refactor: use ScreenHeader for pets limit screen"
```

---

### Task 8: `pets/new.tsx` → detail header

**Files:**

- Modify: `app/(app)/pets/new.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 55-68):

```tsx
<SafeAreaView style={styles.safe} edges={['top']}>
  <View style={styles.header}>
    <Pressable
      onPress={() => router.back()}
      style={styles.backBtn}
      accessibilityRole="button"
      accessibilityLabel="Volver"
    >
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.title}>Nueva mascota</Text>
    <View style={styles.backBtn} />
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.safe}>
  <ScreenHeader title="Nueva mascota" onBack={() => router.back()} testID="newPet" />
```

Change `</SafeAreaView>` → `</View>`, remove the `SafeAreaView` import (confirm no other usage), add:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

Remove `header`, `backBtn`, `title` from `StyleSheet.create` (confirm unused elsewhere first).

- [ ] **Step 2: Run the existing test file**

Run: `npx jest src/__tests__/new-pet-screen.test.tsx`
Expected: PASS.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/pets/new.tsx"
git commit -m "refactor: use ScreenHeader for new pet screen"
```

---

### Task 9: `pets/[id]/edit.tsx` → detail header (3 render paths)

**Files:**

- Modify: `app/(app)/pets/[id]/edit.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

This screen has 3 separate `return` statements (pending, not-found, loaded) that each repeat the identical header block verbatim (verified at lines 54-67, 102-115, 123-136):

```tsx
<SafeAreaView style={styles.safe} edges={['top']}>
  <View style={styles.header}>
    <Pressable
      onPress={() => router.back()}
      style={styles.backBtn}
      accessibilityRole="button"
      accessibilityLabel="Volver"
    >
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.title}>Editar mascota</Text>
    <View style={styles.backBtn} />
  </View>
```

- [ ] **Step 1: Edit all 3 occurrences**

In each of the 3 places, replace the block above with:

```tsx
<View style={styles.safe}>
  <ScreenHeader title="Editar mascota" onBack={() => router.back()} testID="pet.edit" />
```

and change that occurrence's matching `</SafeAreaView>` to `</View>`. Add the import once:

```tsx
import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';
```

Remove the `SafeAreaView` import (confirm no other usage in the file first — it is used only for these 3 header wrappers). Remove `header`, `backBtn`, `title` from `StyleSheet.create` (confirm unused elsewhere first — `title` is only used in this header in all 3 paths).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `pets/[id]/edit.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/pets/[id]/edit.tsx"
git commit -m "refactor: use ScreenHeader for pet edit screen"
```

---

### Task 10: `pets/[id]/found.tsx` → detail header

**Files:**

- Modify: `app/(app)/pets/[id]/found.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 40-53):

```tsx
<SafeAreaView style={styles.safe} edges={['top']}>
  <View style={styles.header}>
    <Pressable
      onPress={() => router.back()}
      style={styles.backBtn}
      accessibilityRole="button"
      accessibilityLabel="Volver"
    >
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.headerTitle}>Marcar como encontrado</Text>
    <View style={styles.backBtn} />
  </View>
```

Note: this is inside the main (non-loading) `return`; the earlier pending-state `return` (lines ~29-35) has no header today and stays untouched.

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.safe}>
  <ScreenHeader
    title="Marcar como encontrado"
    onBack={() => router.back()}
    testID="pet.found"
  />
```

Change that occurrence's `</SafeAreaView>` → `</View>` (leave the pending-state `SafeAreaView` at lines 29-35 alone — it does not use the header, but the import is still needed there, so **keep** the `SafeAreaView` import). Add:

```tsx
import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';
```

Remove `header`, `backBtn`, `headerTitle` from `StyleSheet.create` (confirm unused elsewhere first).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `pets/[id]/found.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/pets/[id]/found.tsx"
git commit -m "refactor: use ScreenHeader for mark-pet-found screen"
```

---

### Task 11: `pets/[id]/qr.tsx` → detail header (adds a title where none existed)

**Files:**

- Modify: `app/(app)/pets/[id]/qr.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, full file — this screen has NO title text today, only a bare back arrow):

```tsx
return (
  <View style={styles.screen}>
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} testID="qr.back">
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </Pressable>
    </View>

    <PetQRCode
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
return (
  <View style={styles.screen}>
    <ScreenHeader title="Código QR" onBack={() => router.back()} testID="qr" />

    <PetQRCode
```

Add the import:

```tsx
import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';
```

Remove `header` from `StyleSheet.create` (it was only used by the removed row). This changes the back button's `testID` from `qr.back` to `qr.back` (unchanged, matches `${testID}.back`).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `pets/[id]/qr.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/pets/[id]/qr.tsx"
git commit -m "refactor: use ScreenHeader for pet QR screen, add missing title"
```

---

### Task 12: `places/new.tsx` → detail header

**Files:**

- Modify: `app/(app)/places/new.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 18-26):

```tsx
<View style={styles.screen}>
  <View style={styles.header}>
    <Pressable onPress={() => router.back()} testID="new-place.back">
      <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.title}>Agregar lugar pet-friendly</Text>
    <View style={{ width: 24 }} />
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.screen}>
  <ScreenHeader
    title="Agregar lugar pet-friendly"
    onBack={() => router.back()}
    testID="new-place"
  />
```

Add the import:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

Remove `header` and `title` from `StyleSheet.create` (confirm unused elsewhere first). This changes the back button testID from `new-place.back` to `new-place.back` (unchanged).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `places/new.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/places/new.tsx"
git commit -m "refactor: use ScreenHeader for new place screen"
```

---

### Task 13: `places/[id].tsx` → detail header with dynamic title

**Files:**

- Modify: `app/(app)/places/[id].tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines ~50-58):

```tsx
<View style={styles.headerRow}>
  <Pressable onPress={() => router.back()} testID="place-detail.back">
    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
  </Pressable>
  <Text style={styles.headerTitle} numberOfLines={1}>
    {place.name}
  </Text>
  <View style={{ width: 24 }} />
</View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<ScreenHeader title={place.name} onBack={() => router.back()} testID="place-detail" />
```

Add the import:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

Remove `headerRow` and `headerTitle` from `StyleSheet.create` (confirm unused elsewhere first). This changes the back button testID from `place-detail.back` to `place-detail.back` (unchanged).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `places/[id].tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/places/[id].tsx"
git commit -m "refactor: use ScreenHeader for place detail screen"
```

---

### Task 14: `groups/index.tsx` → detail header, remove manual inset padding

**Files:**

- Modify: `app/(app)/groups/index.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header + wrapper (verified, lines 14-57):

```tsx
const insets = useSafeAreaInsets();
...
if (groupsQuery.isLoading) {
  return (
    <View style={[styles.centered, { paddingTop: insets.top }]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

return (
  <View style={[styles.screen, { paddingTop: insets.top }]}>
    <View style={styles.topBar}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.title}>Grupos</Text>
    </View>
```

`ScreenHeader` now owns the top inset, so the manual `paddingTop: insets.top` on both `screen` and the loading `centered` view must be removed (otherwise the content is pushed down twice).

- [ ] **Step 1: Edit the screen**

Replace the loading return with:

```tsx
if (groupsQuery.isLoading) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
```

Replace the main return's opening with:

```tsx
return (
  <View style={styles.screen}>
    <ScreenHeader title="Grupos" onBack={() => router.back()} testID="groups" />
```

Remove the now-unused `const insets = useSafeAreaInsets();` line and the `useSafeAreaInsets` import from `'react-native-safe-area-context'` (confirm no other usage in the file first). Add:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

Remove `topBar`, `backBtn`, `title` from `StyleSheet.create` (confirm unused elsewhere first).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `groups/index.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/groups/index.tsx"
git commit -m "refactor: use ScreenHeader for groups list screen"
```

---

### Task 15: `groups/[id].tsx` → add missing back header, keep `GroupHeader` hero

**Files:**

- Modify: `app/(app)/groups/[id].tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1. `GroupHeader` (`src/components/groups/GroupHeader.tsx`) is unchanged and untouched.

This screen's main (loaded) render has **no back button at all today** — verified: `GroupHeader` (the photo/banner hero) has no navigation affordance, and the only `router.back()` usage in the file is in the "group not found" error state, not in the success path. This is a real gap, not a style inconsistency.

Current structure (verified, lines 14-90):

```tsx
const insets = useSafeAreaInsets();
...
if (groupQuery.isLoading) {
  return (
    <View style={[styles.centered, { paddingTop: insets.top }]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

if (!group) {
  return (
    <View style={[styles.centered, { paddingTop: insets.top }]}>
      <Text style={styles.errorText}>Grupo no encontrado</Text>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Volver</Text>
      </Pressable>
    </View>
  );
}

const ListHeader = (
  <View>
    <GroupHeader
      group={group}
      onJoin={!group.isMember ? (): void => joinGroup(id) : undefined}
      onLeave={group.isMember ? (): void => leaveGroup(id) : undefined}
      isLoading={isJoining || isLeaving}
    />
    <View style={styles.feedHeader}>
      <Text style={styles.feedTitle}>Publicaciones</Text>
    </View>
  </View>
);

return (
  <View style={[styles.screen, { paddingTop: insets.top }]}>
    <FlatList<Post>
      data={allPosts}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={ListHeader}
      renderItem={({ item }) => (
```

- [ ] **Step 1: Edit the screen**

Replace the loading and not-found returns' `paddingTop: insets.top` usage — leave those two as-is (they're fine standalone, no header involved) **except** remove `insets.top` from them since `insets` will no longer exist once removed in the next step; instead use a small fixed `spacing.xl` there since these are just centered loading/error states without a header:

```tsx
if (groupQuery.isLoading) {
  return (
    <View style={[styles.centered, { paddingTop: spacing.xl }]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

if (!group) {
  return (
    <View style={[styles.centered, { paddingTop: spacing.xl }]}>
      <Text style={styles.errorText}>Grupo no encontrado</Text>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Volver</Text>
      </Pressable>
    </View>
  );
}
```

(`spacing` is already imported in this file — confirm with `grep -n "^import.*spacing" "app/(app)/groups/[id].tsx"`.) Replace the main return with:

```tsx
return (
  <View style={styles.screen}>
    <ScreenHeader title={group.name} onBack={() => router.back()} testID="group-detail" />
    <FlatList<Post>
      data={allPosts}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={ListHeader}
      renderItem={({ item }) => (
```

Remove the now-unused `const insets = useSafeAreaInsets();` and the `useSafeAreaInsets` import (confirm no other usage first). Add:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `groups/[id].tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/groups/[id].tsx"
git commit -m "fix: add missing back header to group detail screen"
```

---

### Task 16: `profile/reports.tsx` → detail header

**Files:**

- Modify: `app/(app)/profile/reports.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 64-76):

```tsx
<View style={styles.screen}>
  <View style={styles.header}>
    <Pressable
      accessibilityRole="button"
      testID="profile.reports.back"
      onPress={() => router.back()}
      style={styles.backButton}
    >
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.headerTitle}>Mis reportes</Text>
    <View style={styles.headerSpacer} />
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.screen}>
  <ScreenHeader title="Mis reportes" onBack={() => router.back()} testID="profile.reports" />
```

Add the import:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

Remove `header`, `backButton`, `headerTitle`, `headerSpacer` from `StyleSheet.create` (confirm unused elsewhere first). This changes the back button testID from `profile.reports.back` to `profile.reports.back` (unchanged).

- [ ] **Step 2: Run the existing test file**

Run: `npx jest src/__tests__/profile-reports-screen.test.tsx`
Expected: PASS.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/profile/reports.tsx"
git commit -m "refactor: use ScreenHeader for my-reports screen"
```

---

### Task 17: `profile/[id].tsx` → detail header with dynamic title

**Files:**

- Modify: `app/(app)/profile/[id].tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 186-201):

```tsx
<SafeAreaView edges={['top']} style={styles.safe}>
  <View style={styles.header}>
    <Pressable
      onPress={onBack}
      accessibilityRole="button"
      style={styles.backBtn}
      testID="profile.back"
    >
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.title} numberOfLines={1}>
      {profile.name}
    </Text>
    <View style={styles.backBtn} />
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.safe}>
  <ScreenHeader title={profile.name} onBack={onBack} testID="profile" />
```

Change that occurrence's `</SafeAreaView>` → `</View>` (check the rest of the file for other `SafeAreaView` usages before removing the import — this screen has other early-return states too; only remove the import if truly unused everywhere). Add:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

Remove `header`, `backBtn`, `title` from `StyleSheet.create` (confirm unused elsewhere first). This changes the back button testID from `profile.back` to `profile.back` (unchanged).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `profile/[id].tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/profile/[id].tsx"
git commit -m "refactor: use ScreenHeader for public profile screen"
```

---

### Task 18: `feed/new-post.tsx` → add missing header

**Files:**

- Modify: `app/(app)/feed/new-post.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

This screen has **no header at all today** (verified, full file) — only a "Cancelar" text button inside `CreatePostForm` itself. This is a real gap.

Current top of render (verified):

```tsx
return (
  <KeyboardAvoidingView
    style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
    <CreatePostForm
      onSubmit={handleSubmit}
      isSubmitting={isPending}
      onCancel={() => router.back()}
      authorName={user?.name}
    />
  </KeyboardAvoidingView>
);
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
return (
  <View style={{ flex: 1, backgroundColor: colors.surface }}>
    <ScreenHeader title="Nuevo post" onBack={() => router.back()} testID="newPost" />
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <CreatePostForm
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        onCancel={() => router.back()}
        authorName={user?.name}
      />
    </KeyboardAvoidingView>
  </View>
);
```

(`paddingTop: insets.top` is removed from the `KeyboardAvoidingView` style since `ScreenHeader` now owns the top inset; `paddingBottom: insets.bottom` stays.) Add the imports:

```tsx
import { View } from 'react-native'; // add View to the existing react-native import list
import { colors } from '../../../src/design/tokens';
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

(`View` and `colors` are not currently imported in this file — check the existing `react-native` import line and add `View` to it rather than a separate import statement.) The internal "Cancelar" button inside `CreatePostForm` is left as-is (out of scope — this task only adds the missing navigation header).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `feed/new-post.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/feed/new-post.tsx"
git commit -m "fix: add missing header to new-post screen"
```

---

### Task 19: `feed/[id].tsx` → restructure: fixed `ScreenHeader` above the list, keep author-info row

**Files:**

- Modify: `app/(app)/feed/[id].tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

This screen's back button is currently baked into a compound row (`postHeader`) that also shows the post author's avatar/name/time, rendered as part of the `FlatList`'s `ListHeaderComponent` (verified, lines 98-117). It needs to split: `ScreenHeader` becomes a fixed bar above the `FlatList`; the author-info row stays inside `ListHeaderComponent` as its own block.

Current (verified):

```tsx
const ListHeader = (
  <View>
    <View style={[styles.postHeader, { paddingTop: insets.top + spacing.md }]}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
      </Pressable>
      <View style={styles.authorInfo}>
        <View style={styles.avatar}>
          {post.authorAvatar ? (
            <Image source={{ uri: post.authorAvatar }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle" size={40} color={colors.border} />
          )}
        </View>
        <View>
          <Text style={styles.authorName}>{post.authorName ?? 'Usuario'}</Text>
          <Text style={styles.time}>{formatRelativeTime(post.createdAt)}</Text>
        </View>
      </View>
    </View>
    {post.content ? <Text style={styles.content}>{post.content}</Text> : null}
    ...
  </View>
);

return (
  <KeyboardAvoidingView
    style={[styles.container, { paddingBottom: insets.bottom }]}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
  >
    <FlatList
      data={allComments}
      keyExtractor={(c) => c.id}
      renderItem={renderComment}
      ListHeaderComponent={ListHeader}
      onEndReached={() => {
        if (commentsQuery.hasNextPage && !commentsQuery.isFetchingNextPage) {
          void commentsQuery.fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.3}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        commentsQuery.isLoading ? null : (
          <Text style={styles.emptyComments}>Sé el primero en comentar</Text>
        )
      }
    />
    {currentUser ? <CommentInput onSubmit={handleComment} isSubmitting={isCommenting} /> : null}
  </KeyboardAvoidingView>
);
```

Related styles (verified): `postHeader` (row container + top padding), `backBtn` (icon-only, no circle), `authorInfo` (avatar+name+time row), `avatar`/`avatarImage`/`authorName`/`time` (author info, kept).

- [ ] **Step 1: Edit the screen**

Replace the `ListHeader` definition's top block with just the author-info row (drop `postHeader`/back button from it):

```tsx
const ListHeader = (
  <View>
    <View style={styles.authorInfoRow}>
      <View style={styles.authorInfo}>
        <View style={styles.avatar}>
          {post.authorAvatar ? (
            <Image source={{ uri: post.authorAvatar }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle" size={40} color={colors.border} />
          )}
        </View>
        <View>
          <Text style={styles.authorName}>{post.authorName ?? 'Usuario'}</Text>
          <Text style={styles.time}>{formatRelativeTime(post.createdAt)}</Text>
        </View>
      </View>
    </View>

    {post.content ? <Text style={styles.content}>{post.content}</Text> : null}
```

Replace the final `return` with:

```tsx
return (
  <View style={styles.screen}>
    <ScreenHeader title="Post" onBack={() => router.back()} testID="feedDetail" />
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <FlatList
        style={styles.list}
        data={allComments}
        keyExtractor={(c) => c.id}
        renderItem={renderComment}
        ListHeaderComponent={ListHeader}
        onEndReached={() => {
          if (commentsQuery.hasNextPage && !commentsQuery.isFetchingNextPage) {
            void commentsQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          commentsQuery.isLoading ? null : (
            <Text style={styles.emptyComments}>Sé el primero en comentar</Text>
          )
        }
      />
      {currentUser ? <CommentInput onSubmit={handleComment} isSubmitting={isCommenting} /> : null}
    </KeyboardAvoidingView>
  </View>
);
```

Add the import:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

In `StyleSheet.create`: remove `postHeader` and `backBtn`; add

```ts
screen: { flex: 1, backgroundColor: colors.background },
list: { flex: 1 },
authorInfoRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md,
  backgroundColor: colors.surface,
},
```

(`colors.background` — reuse the existing `container.backgroundColor` value already used in this file's styles.) Keep `authorInfo`, `avatar`, `avatarImage`, `authorName`, `time` unchanged.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `feed/[id].tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/feed/[id].tsx"
git commit -m "refactor: use ScreenHeader for post detail screen, keep author row in list"
```

---

### Task 20: `stray/[id].tsx` → detail header with dynamic title

**Files:**

- Modify: `app/(app)/stray/[id].tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 75-83):

```tsx
<ScrollView style={styles.screen} contentContainerStyle={styles.content}>
  <View style={styles.headerRow}>
    <Pressable onPress={() => router.back()} testID="stray-detail.back">
      <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.title}>{speciesLabel} suelto</Text>
    <View style={{ width: 24 }} />
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={{ flex: 1 }}>
  <ScreenHeader
    title={`${speciesLabel} suelto`}
    onBack={() => router.back()}
    testID="stray-detail"
  />
  <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
```

Add the matching closing `</View>` right after the existing `</ScrollView>`. Add the import:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

Remove `headerRow` and `title` from `StyleSheet.create` (confirm unused elsewhere first).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `stray/[id].tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/stray/[id].tsx"
git commit -m "refactor: use ScreenHeader for stray detail screen"
```

---

### Task 21: `routes/index.tsx` → detail header with add-route rightSlot

**Files:**

- Modify: `app/(app)/routes/index.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 30-40):

```tsx
<View style={styles.screen}>
  <View style={styles.header}>
    <Pressable onPress={() => router.back()} testID="routes.back">
      <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.title}>Rutas para pasear</Text>
    <Pressable onPress={() => router.push('/(app)/routes/new' as Href)} testID="routes.add">
      <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
    </Pressable>
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.screen}>
  <ScreenHeader
    title="Rutas para pasear"
    onBack={() => router.back()}
    testID="routes"
    rightSlot={
      <Pressable onPress={() => router.push('/(app)/routes/new' as Href)} testID="routes.add">
        <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
      </Pressable>
    }
  />
```

Add the import:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

Remove `header` and `title` from `StyleSheet.create` (confirm unused elsewhere first).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `routes/index.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/routes/index.tsx"
git commit -m "refactor: use ScreenHeader for routes list screen"
```

---

### Task 22: `routes/new.tsx` → detail header, 2-step wizard

**Files:**

- Modify: `app/(app)/routes/new.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current headers (verified): step `'details'` (lines 42-50) and step `'map'` (lines 66-74) each render their own header row with a different `onBack` behavior.

```tsx
if (step === 'details') {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => setStep('map')} testID="new-route.back-to-map">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Detalles de la ruta</Text>
        <View style={{ width: 24 }} />
      </View>
      <RouteForm ...
```

```tsx
return (
  <View style={styles.screen}>
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} testID="new-route.back">
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.title}>Traza la ruta</Text>
      <View style={{ width: 24 }} />
    </View>

    <Text style={styles.hint}>Toca el mapa para agregar puntos de la ruta</Text>
```

- [ ] **Step 1: Edit both steps**

For the `'details'` step, replace its header block with:

```tsx
<ScreenHeader title="Detalles de la ruta" onBack={() => setStep('map')} testID="new-route" />
```

For the `'map'` step, replace its header block with:

```tsx
<ScreenHeader title="Traza la ruta" onBack={() => router.back()} testID="new-route" />
```

Add the import once:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

Remove `header` and `title` from `StyleSheet.create` (confirm unused elsewhere — both steps shared these two keys, now both removed).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `routes/new.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/routes/new.tsx"
git commit -m "refactor: use ScreenHeader for new route wizard"
```

---

### Task 23: `routes/[id].tsx` → detail header with dynamic title

**Files:**

- Modify: `app/(app)/routes/[id].tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 83-93):

```tsx
<ScrollView style={styles.screen} contentContainerStyle={styles.content}>
  <View style={styles.headerRow}>
    <Pressable onPress={() => router.back()} testID="route-detail.back">
      <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.headerTitle} numberOfLines={1}>
      {route.name}
    </Text>
    <View style={{ width: 24 }} />
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={{ flex: 1 }}>
  <ScreenHeader title={route.name} onBack={() => router.back()} testID="route-detail" />
  <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
```

Add the matching closing `</View>` right after the existing `</ScrollView>`. Add the import:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

Remove `headerRow` and `headerTitle` from `StyleSheet.create` (confirm unused elsewhere first).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `routes/[id].tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/routes/[id].tsx"
git commit -m "refactor: use ScreenHeader for route detail screen"
```

---

### Task 24: `services/bookings.tsx` → detail header

**Files:**

- Modify: `app/(app)/services/bookings.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 62-76):

```tsx
<SafeAreaView edges={['top']} style={styles.safe}>
  <View style={styles.headerRow}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      onPress={(): void => router.back()}
      style={styles.backBtn}
      testID="services.bookings.back"
    >
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.headerTitle}>Mis reservas</Text>
    <View style={styles.backBtn} />
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.safe}>
  <ScreenHeader title="Mis reservas" onBack={() => router.back()} testID="services.bookings" />
```

Change `</SafeAreaView>` → `</View>`, remove the `SafeAreaView` import (confirm no other usage), add:

```tsx
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
```

Remove `headerRow`, `backBtn`, `headerTitle` from `StyleSheet.create` (confirm unused elsewhere first). This changes the back button testID from `services.bookings.back` to `services.bookings.back` (unchanged).

- [ ] **Step 2: Run the existing test file**

Run: `npx jest src/__tests__/services-bookings-screen.test.tsx`
Expected: PASS.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/services/bookings.tsx"
git commit -m "refactor: use ScreenHeader for my-bookings screen"
```

---

### Task 25: `services/[categoryId]/index.tsx` → detail header with dynamic title

**Files:**

- Modify: `app/(app)/services/[categoryId]/index.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 40-54):

```tsx
<SafeAreaView edges={['top']} style={styles.safe}>
  <View style={styles.headerRow}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      onPress={(): void => router.back()}
      style={styles.backBtn}
      testID="services.detail.back"
    >
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.headerTitle}>{detail?.name ?? 'Detalle de servicio'}</Text>
    <View style={styles.backBtn} />
  </View>
```

Note: the `needsProviderChoice` early return (lines 34-38) is a bare redirecting `SafeAreaView` with no header — leave it untouched.

- [ ] **Step 1: Edit the screen**

Replace the header block above with:

```tsx
<View style={styles.safe}>
  <ScreenHeader
    title={detail?.name ?? 'Detalle de servicio'}
    onBack={() => router.back()}
    testID="services.detail"
  />
```

Change that occurrence's `</SafeAreaView>` → `</View>` (keep the `SafeAreaView` import — it's still used by the `needsProviderChoice` early return). Add:

```tsx
import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';
```

Remove `headerRow`, `backBtn`, `headerTitle` from `StyleSheet.create` (confirm unused elsewhere first).

- [ ] **Step 2: Run the existing test file**

Run: `npx jest src/__tests__/services-detail-screen.test.tsx`
Expected: PASS.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/services/[categoryId]/index.tsx"
git commit -m "refactor: use ScreenHeader for service detail screen"
```

---

### Task 26: `services/[categoryId]/book.tsx` → detail header

**Files:**

- Modify: `app/(app)/services/[categoryId]/book.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 91-104):

```tsx
<SafeAreaView edges={['top']} style={styles.safe}>
  <View style={styles.headerRow}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      onPress={(): void => router.back()}
      style={styles.backBtn}
    >
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.headerTitle}>Solicitar servicio</Text>
    <View style={styles.backBtn} />
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.safe}>
  <ScreenHeader title="Solicitar servicio" onBack={() => router.back()} testID="services.book" />
```

Change `</SafeAreaView>` → `</View>`, remove the `SafeAreaView` import (confirm no other usage), add:

```tsx
import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';
```

Remove `headerRow`, `backBtn`, `headerTitle` from `StyleSheet.create` (confirm unused elsewhere first).

- [ ] **Step 2: Run the existing test file**

Run: `npx jest src/__tests__/services-book-screen.test.tsx`
Expected: PASS.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/services/[categoryId]/book.tsx"
git commit -m "refactor: use ScreenHeader for book-service screen"
```

---

### Task 27: `services/[categoryId]/providers.tsx` → detail header

**Files:**

- Modify: `app/(app)/services/[categoryId]/providers.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 20-34):

```tsx
<SafeAreaView edges={['top']} style={styles.safe}>
  <View style={styles.headerRow}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      onPress={(): void => router.back()}
      style={styles.backBtn}
      testID="services.providers.back"
    >
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.title}>Elige un proveedor</Text>
    <View style={styles.backBtn} />
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.safe}>
  <ScreenHeader
    title="Elige un proveedor"
    onBack={() => router.back()}
    testID="services.providers"
  />
```

Change `</SafeAreaView>` → `</View>`, remove the `SafeAreaView` import (confirm no other usage), add:

```tsx
import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';
```

Remove `headerRow`, `backBtn`, `title` from `StyleSheet.create` (confirm unused elsewhere first). This changes the back button testID from `services.providers.back` to `services.providers.back` (unchanged).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `services/[categoryId]/providers.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/services/[categoryId]/providers.tsx"
git commit -m "refactor: use ScreenHeader for provider list screen"
```

---

### Task 28: `radar/report/new.tsx` → detail header with dynamic title and step-aware back

**Files:**

- Modify: `app/(app)/radar/report/new.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 294-307). `title` is a `let` reassigned earlier in the function body based on wizard step (line 198 onward); `handleBackPress` is an existing `useCallback` (line 81) that already handles step-aware back navigation — neither needs to change, only the JSX that renders them:

```tsx
<SafeAreaView edges={['top']} style={styles.safe}>
  <View style={styles.headerRow}>
    <Pressable
      accessibilityLabel="Volver"
      onPress={handleBackPress}
      style={styles.backCircle}
      testID="radar.wizard.back"
    >
      <Ionicons color={colors.white} name="chevron-back" size={22} />
    </Pressable>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={styles.headerSpacer} />
  </View>
  {body}
</SafeAreaView>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.safe}>
  <ScreenHeader title={title} onBack={handleBackPress} testID="radar.wizard" />
  {body}
</View>
```

Change `</SafeAreaView>` → `</View>` (verify no other `SafeAreaView` usage in the file before removing the import — check the `loadingWrap` style usage a few lines above; if it's used in a separate early return with its own `SafeAreaView`, keep the import). Add:

```tsx
import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';
```

Remove `headerRow`, `backCircle`, `headerTitle`, `headerSpacer` from `StyleSheet.create` (confirm unused elsewhere first). This changes the back button testID from `radar.wizard.back` to `radar.wizard.back` (unchanged).

- [ ] **Step 2: Run the existing test files**

Run: `npx jest src/__tests__/radar-report-wizard.test.tsx src/__tests__/radar-list-view.test.tsx`
Expected: PASS.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/radar/report/new.tsx"
git commit -m "refactor: use ScreenHeader for radar report wizard"
```

---

### Task 29: `reports/[id]/edit.tsx` → detail header

**Files:**

- Modify: `app/(app)/reports/[id]/edit.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified):

```tsx
<SafeAreaView edges={['top']} style={styles.safe}>
  <View style={styles.headerRow}>
    <Pressable
      accessibilityLabel="Volver"
      onPress={onBack}
      style={styles.backCircle}
      testID="report.edit.back"
    >
      <Ionicons color={colors.white} name="chevron-back" size={22} />
    </Pressable>
    <Text style={styles.headerTitle}>Editar reporte</Text>
    <View style={styles.headerSpacer} />
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.safe}>
  <ScreenHeader title="Editar reporte" onBack={onBack} testID="report.edit" />
```

Change `</SafeAreaView>` → `</View>`, remove the `SafeAreaView` import (confirm no other usage), add:

```tsx
import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';
```

Remove `headerRow`, `backCircle`, `headerTitle`, `headerSpacer` from `StyleSheet.create` (confirm unused elsewhere first). This changes the back button testID from `report.edit.back` to `report.edit.back` (unchanged).

- [ ] **Step 2: Run the existing test file**

Run: `npx jest src/__tests__/report-edit-screen.test.tsx`
Expected: PASS.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/reports/[id]/edit.tsx"
git commit -m "refactor: use ScreenHeader for report edit screen"
```

---

### Task 30: `reports/[id]/sighting.tsx` → detail header, 2-step wizard with rightSlot on the form step

**Files:**

- Modify: `app/(app)/reports/[id]/sighting.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current headers (verified): `'intro'` step (lines 225-237) and `'form'` step (lines 298-318). Both share the same title and `onBack`; only the form step has a right-side submit button instead of a spacer.

```tsx
{step === 'intro' ? (
  <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.headerRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={onBack}
        style={styles.backBtn}
        testID="reportSighting.back"
      >
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.title}>Reporte de avistamiento</Text>
      <View style={styles.backBtn} />
    </View>
    ...
  </ScrollView>
) : (
  <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.headerRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={onBack}
        style={styles.backBtn}
        testID="reportSighting.back"
      >
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.title}>Reporte de avistamiento</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void submit()}
        disabled={!canSubmit}
        style={[styles.topSubmit, !canSubmit ? styles.topSubmitDisabled : null]}
        testID="reportSighting.topSubmit"
      >
        <Ionicons name="cloud-upload-outline" size={16} color={colors.white} />
        <Text style={styles.topSubmitText}>Reportar avistamiento</Text>
      </Pressable>
    </View>
    ...
```

- [ ] **Step 1: Edit both steps**

Replace the intro step's header block with:

```tsx
<ScreenHeader title="Reporte de avistamiento" onBack={onBack} testID="reportSighting" />
```

Replace the form step's header block with:

```tsx
<ScreenHeader
  title="Reporte de avistamiento"
  onBack={onBack}
  testID="reportSighting"
  rightSlot={
    <Pressable
      accessibilityRole="button"
      onPress={() => void submit()}
      disabled={!canSubmit}
      style={[styles.topSubmit, !canSubmit ? styles.topSubmitDisabled : null]}
      testID="reportSighting.topSubmit"
    >
      <Ionicons name="cloud-upload-outline" size={16} color={colors.white} />
      <Text style={styles.topSubmitText}>Reportar avistamiento</Text>
    </Pressable>
  }
/>
```

Add the import once:

```tsx
import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';
```

Remove `headerRow`, `backBtn`, `title` from `StyleSheet.create` (confirm unused elsewhere first — both steps shared these). Keep `topSubmit`, `topSubmitDisabled`, `topSubmitText`. This changes the back button testID from `reportSighting.back` to `reportSighting.back` (unchanged).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `reports/[id]/sighting.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/reports/[id]/sighting.tsx"
git commit -m "refactor: use ScreenHeader for report sighting wizard"
```

---

### Task 31: `reports/[id]/found.tsx` → detail header

**Files:**

- Modify: `app/(app)/reports/[id]/found.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 99-113). The earlier pending-state return (lines 88-97) has no header and stays untouched:

```tsx
<SafeAreaView edges={['top']} style={styles.safe}>
  <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.headerRow}>
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        style={styles.backBtn}
        testID="report.found.back"
      >
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.headerTitle}>Reporte de mascota</Text>
      <View style={styles.backBtn} />
    </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.safe}>
  <ScreenHeader title="Reporte de mascota" onBack={onBack} testID="report.found" />
  <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
```

Change that occurrence's `</SafeAreaView>` → `</View>` (keep the `SafeAreaView` import — the pending-state return still uses it). Add:

```tsx
import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';
```

Remove `headerRow`, `backBtn`, `headerTitle` from `StyleSheet.create` (confirm unused elsewhere first).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `reports/[id]/found.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/reports/[id]/found.tsx"
git commit -m "refactor: use ScreenHeader for report-found screen"
```

---

### Task 32: `reports/[id]/map.tsx` → detail header

**Files:**

- Modify: `app/(app)/reports/[id]/map.tsx`

**Interfaces:**

- Consumes: `ScreenHeader` from Task 1.

Current header (verified, lines 40-55). The earlier pending/error-state returns (lines 23-36) have no header and stay untouched:

```tsx
<SafeAreaView edges={['top']} style={styles.safe}>
  <View style={styles.header}>
    <Pressable
      accessibilityRole="button"
      onPress={() => router.back()}
      style={styles.backBtn}
      testID="report.map.back"
    >
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.title} numberOfLines={1}>
      Ver mapa
    </Text>
    <View style={styles.backBtn} />
  </View>
```

- [ ] **Step 1: Edit the screen**

Replace with:

```tsx
<View style={styles.safe}>
  <ScreenHeader title="Ver mapa" onBack={() => router.back()} testID="report.map" />
```

Change that occurrence's `</SafeAreaView>` → `</View>` (keep the `SafeAreaView` import — the earlier pending/error returns still use it). Add:

```tsx
import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';
```

Remove `header`, `backBtn`, `title` from `StyleSheet.create` (confirm unused elsewhere first).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
(No dedicated test file for `reports/[id]/map.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/reports/[id]/map.tsx"
git commit -m "refactor: use ScreenHeader for report map screen"
```

---

## Final verification (after all tasks)

- [ ] Run the full test suite: `npx jest`
- [ ] Run the full typecheck: `npx tsc --noEmit`
- [ ] Run lint: `npm run lint`
- [ ] Start the app (`npm run ios` or `npm run android` or `npm run web`) and manually click through: Home (unchanged), Mascotas tab → mascota detail → editar/found/QR, Radar tab → reportar, Servicios tab → categoría → reservar, Perfil tab → Ajustes → Mis reportes, Grupos, un post de Feed, un reporte de mascota perdida (detalle sigue con hero, sighting, found, mapa), una ruta.
