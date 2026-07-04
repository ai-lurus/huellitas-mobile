# Pets screen: vertical list instead of horizontal paging

## Problem

`app/(app)/pets/index.tsx` ("Mis mascotas") shows each pet as a full-width page
inside a `ScrollView horizontal pagingEnabled`, one pet visible at a time,
swiped left/right, with a "X de Y" counter tracking the current page.

This paging/carousel interaction doesn't fit a list of owned pets — it hides
all but one pet at a time and requires horizontal swiping to see the rest.
The user wants a standard vertical list instead: scroll down to see all pets.

## Solution

Replace the horizontal pager with a vertical `FlatList`:

- **List**: `FlatList` (vertical, default), `data={pets}`, `keyExtractor={(pet) => pet.id}`,
  renders one `PetHeroCard` per pet. `ItemSeparatorComponent` (or gap in
  `contentContainerStyle`) provides vertical spacing between cards, matching
  spacing conventions elsewhere in the app (`spacing.md`/`spacing.lg`).
- **Header**: keep the title "Mis mascotas" and the user avatar. Remove the
  "X de Y" counter — it tracked pager position, which no longer exists, and
  the user confirmed it should simply be dropped (not replaced with a total
  count).
- **Add pet card**: stays exactly as today — fixed below the list, outside
  the scrollable area, always visible. Confirmed by user: no change here.
- **State removed**: `page` state and the `onMomentumScrollEnd` handler are
  deleted, since there's no paging left to track. `width`/`cardWidth` is
  still needed for the fixed add-card width, so `useWindowDimensions` stays.
- **No changes** to `PetHeroCard` itself — it's already sized as a card, not
  a full-screen page, so it drops into a vertical list without modification.
- **Loading skeleton**: already a vertical `FlatList` of `PetCardSkeleton` —
  unchanged, and now visually consistent with the loaded state's list.
- **Empty/error states**: unchanged.

## Out of scope

- Pull-to-refresh (not requested).
- Any change to `PetHeroCard` layout/content.
- Any change to loading/empty/error states beyond what's inherent to removing paging.

## Testing

- Existing tests referencing `pets.add`, `petCard.<id>`, `petCard.<id>.carnet`,
  `petCard.<id>.rutina` test IDs should continue to pass unchanged, since
  those elements aren't renamed.
- Any test asserting on paging behavior (page counter text, horizontal swipe)
  needs to be removed/updated since that behavior no longer exists.
