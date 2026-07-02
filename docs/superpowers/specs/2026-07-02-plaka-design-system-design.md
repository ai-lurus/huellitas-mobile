# PLAKA Design System — Foundation + Footer (2026-07-02)

## Context

The app is rebranding from "Huellitas" to "PLAKA" with a new visual identity: a
4-color brand palette, Montserrat/Inter typography, and a responsive footer
navigation. This is the first step toward treating `src/design/tokens.ts` as a
real design system that components import from, instead of ad-hoc styling.

Scope for this pass: colors, typography tokens + font loading, and the footer
(`AppTabBar`) as the first component migrated to the new responsive rule. The
other ~48 files already consuming `tokens.ts` inherit the new colors
automatically (same token names, new values) but are not otherwise touched.
17 files with hardcoded hex colors are out of scope — future migration.

App rename scope is limited to user-visible text (`app.json` display name,
in-app brand text). Technical identifiers (slug, bundleIdentifier, scheme,
component names like `HuellitasMap`/`HuellitasToast`, tests) are explicitly
out of scope for this pass.

## 1. Color tokens

Brand colors (fixed, given):

| Token         | Hex       | Role                             |
| ------------- | --------- | -------------------------------- |
| `brand.deep`  | `#0B5369` | Azul Plaka Deep — base/marca     |
| `brand.white` | `#FFFFFF` | Blanco Puro — superficie         |
| `brand.mint`  | `#00F0B5` | Mint Tecnológico — acción diaria |
| `brand.coral` | `#FF4B4B` | Rojo Coral — alerta/radar        |

Derived semantic tokens (replace the current arbitrary values in
`tokens.ts`'s `colors` export, keeping the same key names so consumers don't
need to change):

| Token                          | Hex                    | Derivation                                                                                                                                                                                                                           |
| ------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `primary`                      | `#0B5369`              | = brand.deep                                                                                                                                                                                                                         |
| `primaryDark`                  | `#083E4D`              | brand.deep darkened ~20%, pressed states                                                                                                                                                                                             |
| `accent`                       | `#00785B`              | mint darkened to ≥4.5:1 contrast on white — `colors.accent` is consumed today as text/icon/spinner color in several files (`PetQRCode`, `StrayCard`, `RouteBottomSheet`, onboarding), so it must stay legible, not the raw neon mint |
| `danger`                       | `#FF4B4B`              | = brand.coral, raw — mostly consumed as fills/icons/borders today                                                                                                                                                                    |
| `dangerDark`                   | `#C62828`              | coral darkened for legible error text (existing key, already the one most error-text call sites use)                                                                                                                                 |
| `dangerSoft`                   | `#FFEDED`              | coral tint, alert banner backgrounds                                                                                                                                                                                                 |
| `dangerIcon`                   | `#D32F2F`              | mid-tone coral for icon use (existing key, kept)                                                                                                                                                                                     |
| `success`                      | `#00785B`              | same reasoning as `accent` — `colors.success` is consumed directly as text/icon/spinner color in many places (stat numbers, checkmarks, `ActivityIndicator`), so it uses the legible darkened mint, not raw `#00F0B5`                |
| `successIcon`                  | `#00785B`              | same value as `success`, kept as a separate key for API compatibility                                                                                                                                                                |
| `textPrimary`                  | `#0F2933`              | brand.deep darkened near-black                                                                                                                                                                                                       |
| `textSecondary`                | `#5C7480`              | brand.deep lightened + desaturated                                                                                                                                                                                                   |
| `textMuted`                    | `rgba(15,41,51,0.42)`  | textPrimary at reduced opacity                                                                                                                                                                                                       |
| `border`                       | `#DCE6E9`              | brand.deep heavily lightened                                                                                                                                                                                                         |
| `background` / `backgroundApp` | `#F6FAFA`              | brand.deep heavily lightened, near-white                                                                                                                                                                                             |
| `surface`                      | `#FFFFFF`              | = brand.white                                                                                                                                                                                                                        |
| `navActive`                    | `#0B5369`              | = primary; used for default active-tab state                                                                                                                                                                                         |
| `google`                       | `#4285F4`              | unchanged — Google brand guideline, not part of PLAKA palette                                                                                                                                                                        |
| `white` / `black`              | unchanged              | `#FFFFFF` / `#000000`                                                                                                                                                                                                                |
| `iconMuted`                    | `#5C7480`              | = `textSecondary`, same brand-derived gray instead of the old unrelated `#6B7280`                                                                                                                                                    |
| `infoBorder`                   | `#0B5369`              | = `primary`                                                                                                                                                                                                                          |
| `infoBackground`               | `rgba(11,83,105,0.06)` | `primary` at low opacity                                                                                                                                                                                                             |

Keys not explicitly listed above but present in the current `colors` object
(if any turn up during implementation) are re-derived from the closest
semantic match above rather than left with old arbitrary hex values.

Raw brand mint (`#00F0B5`) and raw brand coral (`#FF4B4B`) are not used as
`colors.*` values for text/icon-facing tokens because both fail contrast on
white when used that way against the app's many existing text/icon/spinner
call sites (verified by grepping current usages of `colors.accent`,
`colors.success`, `colors.danger`). `brand.mint` stays available for future
deliberate large-fill use (e.g. onboarding illustrations); `danger` keeps the
raw coral since the vast majority of its current call sites are
fills/icons/borders, not body text — the 3 call sites that do use bare
`colors.danger` as small text color (`SignInForm.tsx:484`,
`SignUpForm.tsx:541`, `PetDetail.tsx:450`, all short bold "delete"-style
labels) keep working, just with a mild, accepted contrast dip versus today.

## 2. Typography

- **Montserrat** (600, 700) → `typography.title`, `typography.heading`.
- **Inter** (400, 500, 600, 700) → `typography.body`, `typography.bodyStrong`,
  `typography.label`, `typography.button`, `typography.caption`.
- Each entry in the `typography` token object gains a `fontFamily` field
  (currently missing — falls back to system font today).
- Fonts loaded via `@expo-google-fonts/montserrat` and
  `@expo-google-fonts/inter` (new deps), loaded with `useFonts` in
  `app/_layout.tsx`. Render is gated (keep splash screen visible) until fonts
  resolve, per standard Expo pattern — reuse `expo-splash-screen` if already
  present, otherwise a simple loading guard.

## 3. Footer / AppTabBar responsive rule

New `src/design/breakpoints.ts`:

```ts
export const BREAKPOINT_TABLET = 400; // pt
```

`AppTabBar` reads width via `useWindowDimensions` and picks a variant:

- **width < 400pt (full bar):** current behavior — full width, top corners
  rounded (`radius.xl`), flush against screen edges, sits at the bottom with
  `insets.bottom` padding.
- **width ≥ 400pt (floating):** 16pt margin on left/right/bottom, full pill
  shape (`radius.full`), `shadows.md`, does not touch screen edges.

Tab coloring (both variants):

- Inactive tab: `colors.textSecondary`.
- Active tab (non-alert routes): `colors.primary`.
- Center "Reportar" FAB (`alerts` route): always `colors.danger` (coral) —
  matches the palette's "Alerta/Radar" semantic, regardless of focus state.

## 4. "PLAKA" visible name

- `app.json`: `expo.name` → `"PLAKA"`.
- `app/(app)/index.tsx:114,120`: brand text/accessibility label
  `"Huellitas"` → `"PLAKA"`.
- No other files touched for naming in this pass (see Context/out-of-scope
  above).

## Out of scope (this pass)

- Migrating the 17 files with hardcoded hex colors to tokens.
- Renaming technical identifiers (slug, bundleIdentifier, scheme) or
  component/file names containing "Huellitas".
- Redesigning components other than `AppTabBar`.
