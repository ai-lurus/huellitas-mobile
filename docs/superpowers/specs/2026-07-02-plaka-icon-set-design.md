# PLAKA Icon Set + App Logo (2026-07-02)

## Context

A new PLAKA-branded icon set and app logo were delivered
(`/Users/laucho/Downloads/Plaka Iconos`), following the color/typography/footer
foundation laid in [[2026-07-02-plaka-design-system-design]]. The set contains
6 line icons (SVG source + 240x240 PNG) — `carnet-id`, `radar`, `tarea-hecha`,
`contacto`, `extraviado`, `puntos` — all drawn in Azul Plaka Deep (`#0B5369`),
plus `plaka-app-icon.png`, a flat mockup of a bone-shaped tag with a "P" mark
on a Deep teal squircle, intended as the new app icon.

This pass wires 4 of the 6 icons into the existing `AppTabBar` (built in the
prior pass) and replaces the app's stale, off-brand icon/splash assets
(leftover default Expo template art — an orange paw and a blue gradient "A")
with derivatives of the new logo. It does not redesign the tab bar's
responsive/color behavior, which is already correct from the prior pass.

## 1. Icon set → `PlakaIcon` component

**Why SVG, not the provided PNGs:** the tab bar recolors icons dynamically
(`colors.textSecondary` inactive / `colors.primary` active, coral-white on the
alert FAB) via a `color` prop on vector icon components today (`Ionicons`,
`FontAwesome5`). The provided PNGs are flat single-color rasters — reusing
them would require the app to ship 2+ tinted variants per icon (like
`speciesIconAssets.ts` does for species icons) or drop the dynamic-color
behavior. The SVG source lets one asset serve every color state via
`currentColor`, matching the existing vector-icon pattern exactly.

**Tooling:**

- Add `react-native-svg-transformer` as a devDependency.
- `metro.config.js`: extend the existing config (which already customizes
  `resolver.resolveRequest` for `@better-auth/core`) to also move `svg` from
  `resolver.assetExts` to `resolver.sourceExts`, and set
  `transformer.babelTransformerPath` to `react-native-svg-transformer`.
- New `svg.d.ts` at the project root (sibling to `expo-env.d.ts`, which is
  auto-generated and must not be edited):
  ```ts
  declare module '*.svg' {
    import type { FC } from 'react';
    import type { SvgProps } from 'react-native-svg';
    const content: FC<SvgProps>;
    export default content;
  }
  ```

**Asset preprocessing:** the source SVGs encode color via inline
`style="stroke: rgb(4%,32%,41%); fill: none; ..."` attributes. `react-native-svg`
does not parse CSS-shorthand `style` strings — it needs real presentation
attributes. Each of the 6 SVGs is copied into `assets/icons/plaka/*.svg` with
every shape's `style` attribute rewritten to explicit attributes
(`stroke`/`fill`/`strokeWidth`/`strokeLinecap`/`fillRule`), and the hardcoded
color swapped for `currentColor` so the icon inherits color from a `color`
prop, e.g.:

```xml
<!-- before -->
<circle cx="17" cy="17" r="12" style="stroke: rgb(4%,32%,41%); stroke-width: 2.2; fill: none;"/>
<!-- after -->
<circle cx="17" cy="17" r="12" stroke="currentColor" stroke-width="2.2" fill="none"/>
```

The existing `scale(1,-1) translate(0,-34)` group transform (an artifact of
the export tool) is kept as-is — it's what makes the icon render right-side
up.

**Component:** `src/components/icons/PlakaIcon.tsx`

```ts
export type PlakaIconName =
  | 'carnet-id'
  | 'radar'
  | 'tarea-hecha'
  | 'contacto'
  | 'extraviado'
  | 'puntos';

export function PlakaIcon({
  name,
  size = 22,
  color,
}: {
  name: PlakaIconName;
  size?: number;
  color: string;
}): React.ReactElement {
  /* looks up name in a Record<PlakaIconName, SvgComponent> */
}
```

All 6 icons are registered in the `Record`, even though only 4 are consumed
this pass — `tarea-hecha` and `puntos` don't map to any current route (a
checkmark and a star have no obvious home among Inicio/Mapa/Alerta/Mascotas/
Perfil) and are left available for a future feature rather than forced into
the tab bar.

## 2. `AppTabBar` mapping

| Route (unchanged)      | Today                                          | New                                                  |
| ---------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `index` (Inicio)       | `Ionicons` `home`/`home-outline`               | **unchanged** — no matching icon in the set          |
| `map` (Mapa)           | `Ionicons` `location`/`location-outline`       | `<PlakaIcon name="radar">`                           |
| `alerts` (Alerta, FAB) | `Ionicons name="notifications"` white on coral | `<PlakaIcon name="extraviado" color={colors.white}>` |
| `pets` (Mascotas)      | `FontAwesome5 name="bone"`                     | `<PlakaIcon name="carnet-id">`                       |
| `profile` (Perfil)     | `Ionicons` `person`/`person-outline`           | `<PlakaIcon name="contacto">`                        |

Rationale for the mapping (visual match, not guesswork): `carnet-id` renders
as a literal ID card (photo circle + text lines) — the app already calls a
pet's profile a "tarjeta" (`pets/[id].tsx:25`, "¿Eliminar tarjeta de X?").
`radar` is concentric bullseye rings, matching "search/track on a map."
`extraviado` renders as a plain flag — the universal "report/mark a lost
pet" glyph, fitting the alert/report FAB. `contacto` renders as a
smartphone outline, fitting the profile/contact-info tab.

No active/inactive color redesign: `PlakaIcon` receives the same
`color` value (`colors.textSecondary` / `colors.primary` / `colors.white`)
the vector icons receive today — this pass is an icon swap, not a
recoloring of the tab bar (already done in the prior pass).

`FontAwesome5` import is dropped from `AppTabBar.tsx` once `pets` no longer
uses it (`Ionicons` stays, for `index`/`profile`/the alert FAB's fallback
`ellipse-outline`).

## 3. App icon / logo replacement

The provided `plaka-app-icon.png` (1049×1058, no alpha, corners already
rounded into a squircle on a white canvas) can't be dropped directly into
Expo's icon fields: iOS/Android apply their own corner mask on top of
whatever image is given, so a pre-rounded source produces a visibly
double-rounded icon with a mismatched white border where the OS's mask
shape (square-ish on iOS, sometimes circular on Android launchers) doesn't
line up with the squircle already baked into the pixels.

Processing (one-off local script using Pillow, installed as a throwaway
tool — not a project dependency):

1. Crop the white margin so the teal squircle content fills the frame
   edge-to-edge, producing a clean full-bleed square.
2. Threshold the flat 2-color image (teal fill vs. white mark) to separate
   the bone+"P" mark from its teal backing.
3. Emit:
   - `assets/icon.png` (1024×1024) — full-bleed square, teal + white mark
     (iOS applies its own rounding; this replaces the old default-template
     orange/black paw icon reference used nowhere else, and the stale
     generic Expo icon).
   - `assets/android-icon-foreground.png` (512×512) — mark only, white,
     transparent background, scaled/centered inside the ~66% adaptive-icon
     safe zone (replacing the current placeholder blue gradient "A", which
     is unrelated leftover Expo template art, not a Huellitas asset).
   - `assets/android-icon-background.png` (512×512) — solid `#0B5369` fill.
   - `assets/android-icon-monochrome.png` (432×432) — white silhouette of
     the mark on transparent, for Android's monochrome/themed-icon mode.
   - `assets/favicon.png` (48×48) — small flat crop of the full icon (web
     favicon, not adaptive).
   - `assets/splash-icon.png` — the mark alone (transparent), replacing the
     current off-brand orange paw-print splash image.

`app.json` changes:

- `splash.backgroundColor`: `#B8C1FF` (legacy lavender) → `#0B5369`, so the
  splash screen's solid background matches the mark's native backing color
  instead of clashing with it.
- `android.adaptiveIcon.backgroundColor`: `#E6F4FE` (pale blue) → `#0B5369`,
  same reasoning — this field is a fallback behind `backgroundImage`, kept
  in sync so any launcher that ignores `backgroundImage` still shows brand
  teal, not a mismatched pale blue.
- No other `app.json` fields touched (identifiers, scheme, bundle id,
  `expo-notifications` plugin `color`, and `infoPlist` copy remain
  out of scope, consistent with the prior pass's rule that technical
  identifiers aren't part of a visual-asset pass).

## Testing

- `AppTabBar.test.tsx` (existing): update the `jest.mock('@expo/vector-icons', ...)`
  setup to drop the `FontAwesome5` mock (no longer imported) and add
  `jest.mock('../icons/PlakaIcon', () => ({ PlakaIcon: (props) =>
jest.requireActual('react').createElement('PlakaIcon', props) }))`, mirroring
  the existing mock pattern. This means Jest never has to transform a raw
  `.svg` file — the whole `PlakaIcon` module is replaced before its internal
  SVG imports ever execute.
- New `PlakaIcon.test.tsx`: renders each of the 6 `name` values and asserts
  the right underlying SVG component is selected (e.g. via `testID` or
  snapshot of the rendered element type). This test exercises the real SVG
  imports (unlike `AppTabBar.test.tsx`, which mocks the whole module), so
  `jest.config.js` needs a `transform` entry mapping `"\\.svg$"` to
  `react-native-svg-transformer`, per that library's documented Jest setup —
  Jest does not go through Metro, so the `metro.config.js` transformer alone
  doesn't cover test runs.
- No new tests for the app icon/splash PNGs — visual assets aren't covered
  by the 80% coverage requirement (config, not logic); manually verify via
  `expo prebuild`/`expo start` that the icon and splash render correctly on
  at least one platform.

## Out of scope (this pass)

- Wiring `tarea-hecha` or `puntos` into any screen.
- Any redesign of `AppTabBar`'s responsive/floating behavior or color logic
  (already done in the prior pass).
- `expo-notifications` plugin `color`, app scheme/bundle identifiers,
  `infoPlist` copy.
- Migrating other components (`PetCard`, `ReportCard`, etc.) to
  `PlakaIcon` or the new palette — separate future pass.
