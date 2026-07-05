# Pets Vertical List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the horizontal paging carousel on "Mis mascotas" (`app/(app)/pets/index.tsx`) with a standard vertical list, so all pets are reachable by scrolling down instead of swiping sideways one-at-a-time.

**Architecture:** Single-file change. Swap the `ScrollView horizontal pagingEnabled` for a vertical `FlatList` rendering the existing `PetHeroCard` per pet. Drop the `page` state, `onMomentumScrollEnd` handler, and the "X de Y" header counter, since none of them have meaning without paging. The fixed "Agregar mascota" card below the list is untouched.

**Tech Stack:** React Native, `FlatList` (already imported in the file), existing `PetHeroCard` component, Jest + `@testing-library/react-native` for tests.

## Global Constraints

- No changes to `PetHeroCard` (`src/components/pets/PetHeroCard.tsx`) — it already renders as a card, not a full-screen page.
- No changes to the fixed "Agregar mascota" card — stays outside the scrollable list, always visible (per spec, confirmed by user).
- Remove the "X de Y" counter entirely — do not replace it with a total count (per spec, confirmed by user).
- Existing test IDs (`pets.add`, `petCard.<id>`, `petCard.<id>.carnet`, `petCard.<id>.rutina`) must keep working unchanged.
- Loading/empty/error states are out of scope and must render exactly as before.

---

### Task 1: Add regression test for removed paging counter, convert to vertical list

**Files:**

- Modify: `src/__tests__/pets-screens.test.tsx` (add one test)
- Modify: `app/(app)/pets/index.tsx:1-158` (component implementation)

**Interfaces:**

- Consumes: `usePets()` hook (`petsQuery.data`, `.isPending`, `.isError`, `.refetch`), `PetHeroCard` (`pet`, `onPress`, `onOpenCarnet`, `onOpenRutina` props), `PetCardSkeleton`, `MAX_PETS_PER_USER` — all unchanged, already imported in the file.
- Produces: `PetsScreen` default export — same public behavior (renders `petCard.<id>` per pet, `pets.add` card, `pets.userAvatar`), minus the paging counter text.

- [ ] **Step 1: Write the failing test**

Add this test to `src/__tests__/pets-screens.test.tsx`, inside the `describe('Pets screens', ...)` block (after the existing `'renderiza lista con un PetCard por mascota'` test):

```tsx
it('no muestra el contador de paginado "X de Y" con la lista vertical', async () => {
  petsService.listPets.mockResolvedValueOnce([
    { id: 'pet_1', name: 'Max', species: 'dog', isLost: false, photoUrl: null },
    { id: 'pet_2', name: 'Luna', species: 'cat', isLost: true, photoUrl: null },
  ]);

  const { findByTestId, queryByText } = renderWithQuery(<PetsScreen />);

  expect(await findByTestId('petCard.pet_1')).toBeTruthy();
  expect(await findByTestId('petCard.pet_2')).toBeTruthy();
  expect(queryByText('1 de 2')).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/pets-screens.test.tsx -t "contador de paginado"`
Expected: FAIL — `queryByText('1 de 2')` finds the counter, so `toBeNull()` fails (the current header renders "1 de 2" for a 2-pet list).

- [ ] **Step 3: Read the current implementation**

Read `app/(app)/pets/index.tsx` in full (158 lines) to have exact current content before editing.

- [ ] **Step 4: Remove paging state and header counter**

In `app/(app)/pets/index.tsx`, remove the `page` state and the counter `Text` in the header:

Remove this line (around line 35):

```tsx
const [page, setPage] = useState(0);
```

Remove this block from `headerRow` (around lines 60-64):

```tsx
{
  !isEmpty ? (
    <Text style={styles.counter}>
      {Math.min(page + 1, count)} de {count}
    </Text>
  ) : null;
}
```

`useState` import from `'react'` stays (still used elsewhere? check — if `page` was the only `useState` usage, remove `useState` from the `import React, { useCallback, useState } from 'react';` line, keeping `useCallback`). Confirm by grepping the file for `useState` after the edit; if no other usage remains, change the import to `import React, { useCallback } from 'react';`.

- [ ] **Step 5: Replace the horizontal pager with a vertical FlatList**

Replace this block (the `<ScrollView horizontal ...>...</ScrollView>` around lines 111-131):

```tsx
<ScrollView
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  onMomentumScrollEnd={(e) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width));
    setPage(next);
  }}
  contentContainerStyle={styles.pagerContent}
>
  {pets.map((pet) => (
    <View key={pet.id} style={{ width, paddingHorizontal: spacing.lg }}>
      <PetHeroCard
        pet={pet}
        onPress={() => openPet(pet.id)}
        onOpenCarnet={() => openPet(pet.id, 'carnet')}
        onOpenRutina={() => openPet(pet.id, 'rutina')}
      />
    </View>
  ))}
</ScrollView>
```

with:

```tsx
<FlatList
  data={pets}
  keyExtractor={(pet) => pet.id}
  contentContainerStyle={styles.listContent}
  ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
  renderItem={({ item: pet }) => (
    <PetHeroCard
      pet={pet}
      onPress={() => openPet(pet.id)}
      onOpenCarnet={() => openPet(pet.id, 'carnet')}
      onOpenRutina={() => openPet(pet.id, 'rutina')}
    />
  )}
/>
```

Note this reuses the existing `styles.listContent` (already defined for the loading skeleton, with `paddingHorizontal: spacing.lg`), so the loaded list and the loading skeleton now share identical horizontal padding.

- [ ] **Step 6: Add the item separator style and remove the now-unused pager style**

In the `StyleSheet.create` block, remove:

```tsx
  pagerContent: { paddingBottom: spacing.md },
```

Add, near `listContent`:

```tsx
  itemSeparator: { height: spacing.md },
```

- [ ] **Step 7: Remove now-unused `ScrollView` import if applicable**

Grep the file for remaining `ScrollView` usage (there should be none left, since the only other `ScrollView` was the one just replaced). Remove `ScrollView` from the `react-native` import list at the top of the file, so it reads:

```tsx
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx jest src/__tests__/pets-screens.test.tsx -t "contador de paginado"`
Expected: PASS

- [ ] **Step 9: Run the full pets-screens test file to check for regressions**

Run: `npx jest src/__tests__/pets-screens.test.tsx`
Expected: All tests PASS (including `'renderiza lista con un PetCard por mascota'`, `'muestra empty state...'`, `'tap en PetCard navega a detalle'`, `'delete muestra confirmación...'`).

- [ ] **Step 10: Commit**

```bash
git add app/"(app)"/pets/index.tsx src/__tests__/pets-screens.test.tsx
git commit -m "fix: show pets as a vertical list instead of horizontal paging"
```

---

### Task 2: Manual verification in the running app

**Files:** None (verification only, no code changes).

**Interfaces:** N/A.

- [ ] **Step 1: Start the app**

Use the project's `run` skill (or `npm run start` / `npx expo start`, matching however this project is normally launched) and open the "Mis mascotas" tab with at least 2 seeded pets.

- [ ] **Step 2: Verify vertical scroll behavior**

Confirm: all pet cards stack vertically and are reachable by scrolling down (not swiping sideways), the header no longer shows any "X de Y" text, and the "Agregar mascota" card remains fixed below the list.

- [ ] **Step 3: Verify tap targets still work**

Tap a pet card to confirm navigation to its detail screen, and tap "Bitácora de vacunas" / "Calendario" on a card to confirm they still route to `carnet` / `rutina` tabs respectively.
