# PLAKA Icon Set + App Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the new PLAKA icon set into `AppTabBar` and replace the app's stale, off-brand icon/splash assets with derivatives of the new PLAKA logo.

**Architecture:** A new `PlakaIcon` component wraps 6 SVGs (converted to use `currentColor` so they can be tinted like the existing `Ionicons`/`FontAwesome5` icons) via `react-native-svg` + `react-native-svg-transformer`. `AppTabBar` swaps 3 of its route icons and its alert-FAB icon to `PlakaIcon`, keeping its existing color logic untouched. The app icon/splash/adaptive-icon files are regenerated from the provided flat logo mockup via a one-off local image-processing script (not a project dependency), and two stale background colors in `app.json` are corrected to match.

**Tech Stack:** React Native + Expo (existing), `react-native-svg` (already a dependency), new devDependency `react-native-svg-transformer`, Jest + `@testing-library/react-native` (existing).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-02-plaka-icon-set-design.md` — read it before starting; this plan implements it exactly.
- Source assets (read-only, external to the repo): `/Users/laucho/Downloads/Plaka Iconos/svg/*.svg`, `/Users/laucho/Downloads/Plaka Iconos/app-logo/plaka-app-icon.png`.
- Brand teal for any newly-generated solid fill: `#0B5369` (must match `colors.primary` in `src/design/tokens.ts`).
- `index` (Inicio) route icon is explicitly unchanged — do not touch it beyond what's needed to keep it compiling.
- No new runtime dependency for image processing (Pillow/numpy/scipy are throwaway local tools for Task 3's one-off script only — never added to `package.json`).
- `tarea-hecha` and `puntos` icons are imported/registered but not wired into any screen this pass.
- Coverage threshold is 80% (branches/functions/lines/statements) per `jest.config.js` — every new file needs tests hitting all branches.

---

### Task 1: `PlakaIcon` component + SVG tooling

**Files:**

- Modify: `package.json` (add `react-native-svg-transformer` devDependency)
- Modify: `metro.config.js`
- Create: `svg.d.ts` (project root, sibling to `expo-env.d.ts`)
- Create: `assets/icons/plaka/carnet-id.svg`
- Create: `assets/icons/plaka/radar.svg`
- Create: `assets/icons/plaka/tarea-hecha.svg`
- Create: `assets/icons/plaka/contacto.svg`
- Create: `assets/icons/plaka/extraviado.svg`
- Create: `assets/icons/plaka/puntos.svg`
- Create: `src/components/icons/PlakaIcon.tsx`
- Test: `src/components/icons/PlakaIcon.test.tsx`

**Interfaces:**

- Produces: `PlakaIcon({ name, size, color }): React.ReactElement` and `export type PlakaIconName = 'carnet-id' | 'radar' | 'tarea-hecha' | 'contacto' | 'extraviado' | 'puntos'` from `src/components/icons/PlakaIcon.tsx` — Task 2 imports both.

- [ ] **Step 1: Install `react-native-svg-transformer`**

Run: `npm install --save-dev react-native-svg-transformer`
Expected: `package.json` gains `"react-native-svg-transformer": "^1.5.3"` (or newer patch) under `devDependencies`; `package-lock.json` updates.

- [ ] **Step 2: Configure Metro to transform `.svg` as components**

Modify `metro.config.js` — insert before the final `module.exports = config;` line:

```js
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];
```

The full file should read:

```js
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

/**
 * Metro no resuelve bien `exports` con comodín (`./utils/*`) en `@better-auth/core`.
 * `@better-auth/expo` importa `@better-auth/core/utils/json` → falla el bundle web si no se fuerza la ruta.
 */
const betterAuthCoreUtilsJson = path.resolve(
  __dirname,
  'node_modules',
  '@better-auth',
  'core',
  'dist',
  'utils',
  'json.mjs',
);

const previousResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@better-auth/core/utils/json') {
    return {
      type: 'sourceFile',
      filePath: betterAuthCoreUtilsJson,
    };
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;
```

- [ ] **Step 3: Add the `.svg` module type declaration**

Create `svg.d.ts` at the project root:

```ts
declare module '*.svg' {
  import type { FC } from 'react';
  import type { SvgProps } from 'react-native-svg';

  const content: FC<SvgProps>;
  export default content;
}
```

No change needed to `tsconfig.json` — its `include` already covers `**/*.ts`, which matches `svg.d.ts`.

- [ ] **Step 4: Add the converted SVG source files**

The originals (`/Users/laucho/Downloads/Plaka Iconos/svg/*.svg`) encode color via inline `style="stroke: rgb(4%,32%,41%); fill: none; ..."`, which `react-native-svg` cannot parse — it needs real presentation attributes. Create these 6 files with the color swapped for `currentColor` and `style` expanded into attributes (dropping the unused `<title>`/`<desc>` placeholder text and the redundant `<clipPath>`, since every shape already sits inside the `0 0 34 34` viewBox):

Create `assets/icons/plaka/carnet-id.svg`:

```xml
<svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
  <g transform="scale(1,-1) translate(0,-34)">
    <rect x="4" y="8" width="26" height="18" rx="4" ry="4" stroke="currentColor" stroke-linecap="butt" stroke-width="2.2" fill="none" fill-rule="evenodd"/>
    <circle cx="11" cy="17" r="3.2" stroke="currentColor" stroke-linecap="butt" stroke-width="2.2" fill="none" fill-rule="evenodd"/>
    <path d="M 18,20 L 26,20 Z" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>
    <path d="M 18,14 L 26,14 Z" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>
  </g>
</svg>
```

Create `assets/icons/plaka/radar.svg`:

```xml
<svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
  <g transform="scale(1,-1) translate(0,-34)">
    <circle cx="17" cy="17" r="12" stroke="currentColor" stroke-linecap="butt" stroke-width="2.2" fill="none" fill-rule="evenodd"/>
    <circle cx="17" cy="17" r="7.5" stroke="currentColor" stroke-linecap="butt" stroke-width="2.2" fill="none" fill-rule="evenodd"/>
    <circle cx="17" cy="17" r="2.4" fill="currentColor" fill-rule="evenodd"/>
  </g>
</svg>
```

Create `assets/icons/plaka/tarea-hecha.svg`:

```xml
<svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
  <g transform="scale(1,-1) translate(0,-34)">
    <circle cx="17" cy="17" r="12" stroke="currentColor" stroke-linecap="butt" stroke-width="2.2" fill="none" fill-rule="evenodd"/>
    <polyline points="11 17, 15.5 12.5, 23 20.5" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" fill="none" fill-rule="evenodd"/>
  </g>
</svg>
```

Create `assets/icons/plaka/contacto.svg`:

```xml
<svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
  <g transform="scale(1,-1) translate(0,-34)">
    <rect x="11" y="4" width="12" height="26" rx="4" ry="4" stroke="currentColor" stroke-linecap="butt" stroke-width="2.2" fill="none" fill-rule="evenodd"/>
    <path d="M 15,26 L 19,26 Z" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>
    <circle cx="17" cy="8.5" r="1.4" fill="currentColor" fill-rule="evenodd"/>
  </g>
</svg>
```

Create `assets/icons/plaka/extraviado.svg`:

```xml
<svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
  <g transform="scale(1,-1) translate(0,-34)">
    <path d="M 9,3 L 9,31 Z" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>
    <polygon points="9 29, 26 25, 9 21" stroke="currentColor" stroke-linecap="butt" stroke-width="2.2" fill="none" fill-rule="evenodd"/>
  </g>
</svg>
```

Create `assets/icons/plaka/puntos.svg`:

```xml
<svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
  <g transform="scale(1,-1) translate(0,-34)">
    <polygon points="17 29, 14.06107 21.04508, 5.587322 20.7082, 12.24472 15.45492, 9.946577 7.291796, 17 12, 24.05342 7.291796, 21.75528 15.45492, 28.41268 20.7082, 19.93893 21.04508" stroke="currentColor" stroke-linecap="butt" stroke-width="2.2" fill="none" fill-rule="evenodd"/>
  </g>
</svg>
```

Each source file under `/Users/laucho/Downloads/Plaka Iconos/svg/` has the same `scale(1,-1) translate(0,-34)` group transform and only differs in the shapes listed above — diff each created file against its source (mentally: same coordinates, only `style="..."` replaced by explicit attributes with `currentColor`) to confirm nothing was mistranscribed.

- [ ] **Step 5: Write the failing test for `PlakaIcon`**

Create `src/components/icons/PlakaIcon.test.tsx`:

```tsx
jest.mock('../../../assets/icons/plaka/carnet-id.svg', () => ({
  __esModule: true,
  default: 'CarnetIdIcon',
}));
jest.mock('../../../assets/icons/plaka/radar.svg', () => ({
  __esModule: true,
  default: 'RadarIcon',
}));
jest.mock('../../../assets/icons/plaka/tarea-hecha.svg', () => ({
  __esModule: true,
  default: 'TareaHechaIcon',
}));
jest.mock('../../../assets/icons/plaka/contacto.svg', () => ({
  __esModule: true,
  default: 'ContactoIcon',
}));
jest.mock('../../../assets/icons/plaka/extraviado.svg', () => ({
  __esModule: true,
  default: 'ExtraviadoIcon',
}));
jest.mock('../../../assets/icons/plaka/puntos.svg', () => ({
  __esModule: true,
  default: 'PuntosIcon',
}));

import React from 'react';
import { render } from '@testing-library/react-native';

import { PlakaIcon, type PlakaIconName } from './PlakaIcon';

const CASES: Array<[PlakaIconName, string]> = [
  ['carnet-id', 'CarnetIdIcon'],
  ['radar', 'RadarIcon'],
  ['tarea-hecha', 'TareaHechaIcon'],
  ['contacto', 'ContactoIcon'],
  ['extraviado', 'ExtraviadoIcon'],
  ['puntos', 'PuntosIcon'],
];

describe('PlakaIcon', () => {
  it.each(CASES)('renders the %s icon with the given size and color', (name, elementType) => {
    const { UNSAFE_getByType } = render(<PlakaIcon name={name} size={30} color="#0B5369" />);

    const icon = UNSAFE_getByType(elementType as never);
    expect(icon.props.width).toBe(30);
    expect(icon.props.height).toBe(30);
    expect(icon.props.color).toBe('#0B5369');
  });

  it('defaults size to 22 when not provided', () => {
    const { UNSAFE_getByType } = render(<PlakaIcon name="radar" color="#000000" />);

    expect(UNSAFE_getByType('RadarIcon' as never).props.width).toBe(22);
  });
});
```

Why mock the raw `.svg` imports instead of relying on Metro's transform in Jest: Jest doesn't go through Metro, and `jest-expo`'s preset already maps `.svg` to its own generic _asset_ transformer (returning a stub object, not a component) — see `node_modules/jest-expo/jest-preset.js`. Mocking each `.svg` import directly (the same technique `AppTabBar.test.tsx` already uses for `@expo/vector-icons`) sidesteps that entirely: the mocked module is swapped in before Jest ever has to transform the real file, so no `jest.config.js` changes are needed and no risk of breaking the preset's transform map for every other test.

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx jest src/components/icons/PlakaIcon.test.tsx`
Expected: FAIL — `Cannot find module './PlakaIcon' from 'src/components/icons/PlakaIcon.test.tsx'` (component doesn't exist yet).

- [ ] **Step 7: Implement `PlakaIcon`**

Create `src/components/icons/PlakaIcon.tsx`:

```tsx
import React from 'react';
import type { SvgProps } from 'react-native-svg';

import CarnetIdIcon from '../../../assets/icons/plaka/carnet-id.svg';
import RadarIcon from '../../../assets/icons/plaka/radar.svg';
import TareaHechaIcon from '../../../assets/icons/plaka/tarea-hecha.svg';
import ContactoIcon from '../../../assets/icons/plaka/contacto.svg';
import ExtraviadoIcon from '../../../assets/icons/plaka/extraviado.svg';
import PuntosIcon from '../../../assets/icons/plaka/puntos.svg';

export type PlakaIconName =
  | 'carnet-id'
  | 'radar'
  | 'tarea-hecha'
  | 'contacto'
  | 'extraviado'
  | 'puntos';

const ICONS: Record<PlakaIconName, React.FC<SvgProps>> = {
  'carnet-id': CarnetIdIcon,
  radar: RadarIcon,
  'tarea-hecha': TareaHechaIcon,
  contacto: ContactoIcon,
  extraviado: ExtraviadoIcon,
  puntos: PuntosIcon,
};

export type PlakaIconProps = {
  name: PlakaIconName;
  size?: number;
  color: string;
};

export function PlakaIcon({ name, size = 22, color }: PlakaIconProps): React.ReactElement {
  const Icon = ICONS[name];
  return <Icon width={size} height={size} color={color} />;
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx jest src/components/icons/PlakaIcon.test.tsx`
Expected: PASS — 7 tests (6 from `it.each` + the default-size test).

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json metro.config.js svg.d.ts assets/icons/plaka src/components/icons
git commit -m "feat: add PlakaIcon component with the new icon set"
```

---

### Task 2: Wire `PlakaIcon` into `AppTabBar`

**Files:**

- Modify: `src/components/navigation/AppTabBar.tsx`
- Modify: `src/components/navigation/AppTabBar.test.tsx`

**Interfaces:**

- Consumes: `PlakaIcon` and `PlakaIconName` from `src/components/icons/PlakaIcon.tsx` (Task 1).

- [ ] **Step 1: Update the failing/changed tests first**

In `src/components/navigation/AppTabBar.test.tsx`:

Replace the `FontAwesome5` mock block:

```tsx
jest.mock(
  '@expo/vector-icons/FontAwesome5',
  () => (props: Record<string, unknown>) =>
    jest.requireActual('react').createElement('FontAwesome5', props),
);
```

with a `PlakaIcon` mock:

```tsx
jest.mock('../icons/PlakaIcon', () => ({
  PlakaIcon: (props: Record<string, unknown>) =>
    jest.requireActual('react').createElement('PlakaIcon', props),
}));
```

Replace the `'shows filled/outline icons based on focus state'` test with three focused tests (the old one asserted `bone`, `location-outline`, and `person-outline`, all of which no longer exist since those three routes now render `PlakaIcon` instead of `Ionicons`/`FontAwesome5`):

```tsx
it('renders PlakaIcon for the map, pets, and profile tabs', () => {
  const { UNSAFE_getByProps } = render(<AppTabBar {...buildProps({ index: 0 })} />);

  expect(UNSAFE_getByProps({ name: 'radar' })).toBeTruthy();
  expect(UNSAFE_getByProps({ name: 'contacto' })).toBeTruthy();
  expect(UNSAFE_getByProps({ name: 'carnet-id' })).toBeTruthy();
});

it('swaps the Inicio Ionicon between filled and outline based on focus', () => {
  const focused = render(<AppTabBar {...buildProps({ index: 0 })} />);
  expect(focused.UNSAFE_getByProps({ name: 'home' })).toBeTruthy();
  focused.unmount();

  const unfocused = render(<AppTabBar {...buildProps({ index: 1 })} />);
  expect(unfocused.UNSAFE_getByProps({ name: 'home-outline' })).toBeTruthy();
});

it('renders the extraviado icon in white on the alert FAB', () => {
  const { UNSAFE_getByProps } = render(<AppTabBar {...buildProps()} />);

  expect(UNSAFE_getByProps({ name: 'extraviado', color: colors.white })).toBeTruthy();
});
```

- [ ] **Step 2: Run the tests to verify the expected failures**

Run: `npx jest src/components/navigation/AppTabBar.test.tsx`
Expected: FAIL — the 3 new tests fail because `AppTabBar.tsx` hasn't changed yet (still renders `FontAwesome5`/`Ionicons` for `pets`/`map`/`profile`/the alert FAB), so `UNSAFE_getByProps({ name: 'radar' })` etc. find nothing.

- [ ] **Step 3: Update `AppTabBar.tsx`**

In `src/components/navigation/AppTabBar.tsx`, replace the icon imports:

```tsx
import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
```

with:

```tsx
import { Ionicons } from '@expo/vector-icons';

import { PlakaIcon } from '../icons/PlakaIcon';
```

(Keep the existing `colors, radius, shadows, spacing, typography` and `BREAKPOINT_TABLET` imports below it unchanged — just add the `PlakaIcon` import as its own line after them, matching the file's existing import grouping.)

Replace the alert FAB icon:

```tsx
<Ionicons name="notifications" size={26} color={colors.white} />
```

with:

```tsx
<PlakaIcon name="extraviado" size={26} color={colors.white} />
```

Replace the route icon block:

```tsx
let icon: React.ReactNode = <Ionicons name="ellipse-outline" size={TAB_ICON} color={color} />;
if (route.name === 'index') {
  icon = <Ionicons name={isFocused ? 'home' : 'home-outline'} size={TAB_ICON} color={color} />;
} else if (route.name === 'map') {
  icon = (
    <Ionicons name={isFocused ? 'location' : 'location-outline'} size={TAB_ICON} color={color} />
  );
} else if (route.name === 'pets') {
  icon = <FontAwesome5 name="bone" size={20} color={color} />;
} else if (route.name === 'profile') {
  icon = <Ionicons name={isFocused ? 'person' : 'person-outline'} size={TAB_ICON} color={color} />;
}
```

with:

```tsx
let icon: React.ReactNode = <Ionicons name="ellipse-outline" size={TAB_ICON} color={color} />;
if (route.name === 'index') {
  icon = <Ionicons name={isFocused ? 'home' : 'home-outline'} size={TAB_ICON} color={color} />;
} else if (route.name === 'map') {
  icon = <PlakaIcon name="radar" size={TAB_ICON} color={color} />;
} else if (route.name === 'pets') {
  icon = <PlakaIcon name="carnet-id" size={TAB_ICON} color={color} />;
} else if (route.name === 'profile') {
  icon = <PlakaIcon name="contacto" size={TAB_ICON} color={color} />;
}
```

- [ ] **Step 4: Run the full test file to verify it passes**

Run: `npx jest src/components/navigation/AppTabBar.test.tsx`
Expected: PASS — all tests, including the 3 new/changed ones.

- [ ] **Step 5: Run the whole suite to check for regressions**

Run: `npm test`
Expected: PASS — no other file imports `FontAwesome5` from this component or snapshots its output (confirm via the test run; if any other test references `bone`/`FontAwesome5` in this file's context, fix it the same way as Step 1).

- [ ] **Step 6: Commit**

```bash
git add src/components/navigation/AppTabBar.tsx src/components/navigation/AppTabBar.test.tsx
git commit -m "feat: use the PLAKA icon set in the tab bar"
```

---

### Task 3: App icon, splash, and adaptive-icon assets

**Files:**

- Modify: `assets/icon.png`
- Modify: `assets/favicon.png`
- Modify: `assets/splash-icon.png`
- Modify: `assets/android-icon-foreground.png`
- Modify: `assets/android-icon-background.png`
- Modify: `assets/android-icon-monochrome.png`
- Modify: `app.json`

No test file — these are binary visual assets and a config file; verification is visual (Step 4) and via `expo config` (Step 3), not Jest. This is consistent with `jest.config.js`'s `collectCoverageFrom: ['src/**/*.{ts,tsx}', ...]`, which never covered `assets/` or `app.json`.

- [ ] **Step 1: Generate the new icon/splash/adaptive-icon assets**

Create a throwaway Python virtualenv (not part of the repo or its dependencies) and install Pillow, numpy, and scipy into it:

```bash
python3 -m venv /tmp/plaka-icon-venv
/tmp/plaka-icon-venv/bin/pip install -q Pillow numpy scipy
```

Save this script as `/tmp/plaka-icon-venv/gen_icons.py` (adjust `REPO` to this checkout's absolute path):

```python
from PIL import Image
import numpy as np
from scipy import ndimage

SRC = "/Users/laucho/Downloads/Plaka Iconos/app-logo/plaka-app-icon.png"
REPO = "/Users/laucho/Documents/Projects/ai-lurus/huellitas-project/huellitas-mobile/.claude/worktrees/feat+plaka-design-system"
OUT_DIR = f"{REPO}/assets"

BRAND_TEAL = (11, 83, 105)  # #0B5369, must match colors.primary in src/design/tokens.ts

# The source is a flat, already-rounded 1049x1058 mockup (teal squircle + white
# bone/"P" mark on a slightly off-white canvas, JPEG-ish compression noise).
# Classify every pixel as "closer to white" or "closer to teal", find the
# background-connected white region (the outer canvas) vs. the enclosed white
# region (the mark), then rebuild clean assets from the isolated mark shape
# instead of reusing the noisy/pre-rounded source pixels directly.
im = Image.open(SRC).convert("RGB")
arr = np.array(im).astype(int)

white_ref = np.array([249, 248, 248])
teal_ref = np.array([22, 87, 107])
dist_white = np.linalg.norm(arr - white_ref, axis=2)
dist_teal = np.linalg.norm(arr - teal_ref, axis=2)
is_white_ish = dist_white < dist_teal

labeled, _ = ndimage.label(is_white_ish)
bg_label = labeled[0, 0]
mark_mask = is_white_ish & (labeled != bg_label) & (labeled != 0)

squircle_mask = labeled != bg_label
ys, xs = np.where(squircle_mask | mark_mask)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()

mark_crop = mark_mask[y0:y1 + 1, x0:x1 + 1]
mark_img = Image.fromarray((mark_crop * 255).astype("uint8"), mode="L")


def composite_on_teal(mask_img: Image.Image, canvas: int) -> Image.Image:
    """Full-bleed square: brand teal background, white mark scaled to fill it.
    Used for icon.png/favicon.png, which the OS masks itself (no pre-rounding)."""
    alpha = mask_img.resize((canvas, canvas), Image.LANCZOS)
    bg = Image.new("RGB", (canvas, canvas), BRAND_TEAL)
    white = Image.new("RGB", (canvas, canvas), (255, 255, 255))
    return Image.composite(white, bg, alpha).convert("RGB")


def mark_on_transparent(mask_img: Image.Image, canvas: int, scale: float) -> Image.Image:
    """Mark only, transparent background, scaled to `scale` of canvas and centered.
    Used for the Android adaptive-icon foreground/monochrome layers and the splash
    icon, which all composite the mark over a separately-defined background."""
    target = int(canvas * scale)
    w, h = mask_img.size
    if w >= h:
        new_w, new_h = target, round(target * h / w)
    else:
        new_h, new_w = target, round(target * w / h)
    resized = mask_img.resize((new_w, new_h), Image.LANCZOS)
    out = Image.new("L", (canvas, canvas), 0)
    out.paste(resized, ((canvas - new_w) // 2, (canvas - new_h) // 2))
    white = Image.new("RGBA", (canvas, canvas), (255, 255, 255, 255))
    transparent = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    return Image.composite(white, transparent, out)


composite_on_teal(mark_img, 1024).save(f"{OUT_DIR}/icon.png")
composite_on_teal(mark_img, 1024).resize((48, 48), Image.LANCZOS).save(f"{OUT_DIR}/favicon.png")
mark_on_transparent(mark_img, 512, 0.66).save(f"{OUT_DIR}/android-icon-foreground.png")
Image.new("RGB", (512, 512), BRAND_TEAL).save(f"{OUT_DIR}/android-icon-background.png")
mark_on_transparent(mark_img, 432, 0.66).save(f"{OUT_DIR}/android-icon-monochrome.png")
mark_on_transparent(mark_img, 1024, 0.6).save(f"{OUT_DIR}/splash-icon.png")

print("done")
```

Run it:

```bash
/tmp/plaka-icon-venv/bin/python3 /tmp/plaka-icon-venv/gen_icons.py
```

Expected output: `done`, and the 6 files listed above are overwritten in `assets/`.

This script was prototyped and visually verified during design (against the same source file) before being written into this plan — the pixel classification thresholds, bounding-box logic, and the `0.66`/`0.6` safe-zone scale factors are not placeholders, they're the values already confirmed to produce a clean full-bleed `icon.png` and a properly-margined, non-clipped adaptive-icon foreground.

- [ ] **Step 2: Verify the generated files**

Run:

```bash
sips -g pixelWidth -g pixelHeight -g hasAlpha assets/icon.png assets/favicon.png assets/splash-icon.png assets/android-icon-foreground.png assets/android-icon-background.png assets/android-icon-monochrome.png
```

Expected:

- `icon.png`: 1024x1024, `hasAlpha: no` (Apple's App Store icon requirement — no alpha channel).
- `favicon.png`: 48x48.
- `splash-icon.png`: 1024x1024, `hasAlpha: yes`.
- `android-icon-foreground.png`: 512x512, `hasAlpha: yes`.
- `android-icon-background.png`: 512x512, `hasAlpha: no` (solid fill).
- `android-icon-monochrome.png`: 432x432, `hasAlpha: yes`.

If any dimension or alpha flag doesn't match, do not proceed — re-check the script's per-file canvas size/`composite_on_teal` vs. `mark_on_transparent` choice before continuing.

- [ ] **Step 3: Fix the two stale background colors in `app.json`**

In `app.json`, change:

```json
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#B8C1FF"
    },
```

to:

```json
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#0B5369"
    },
```

And change:

```json
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png"
      },
```

to:

```json
      "adaptiveIcon": {
        "backgroundColor": "#0B5369",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png"
      },
```

Then validate the JSON and Expo config both parse correctly:

```bash
npx expo config --json > /dev/null && echo "app.json OK"
```

Expected: `app.json OK` (no JSON syntax errors, Expo accepts the config).

- [ ] **Step 4: Manually verify the new assets render correctly**

Run: `npx expo start`

- Open the app in a simulator/device (or press `w` for web).
- Confirm the splash screen shows the white bone+"P" mark centered on a teal background (not the old orange paw print, not a lavender background).
- Once loaded, background out to the home screen (or check the web favicon tab) and confirm the app icon shows the teal squircle-content with the bone+"P" mark (iOS/browser will apply its own corner rounding — that's expected and correct, not a bug).
- Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 5: Commit**

```bash
git add assets/icon.png assets/favicon.png assets/splash-icon.png assets/android-icon-foreground.png assets/android-icon-background.png assets/android-icon-monochrome.png app.json
git commit -m "feat: replace app icon and splash with the new PLAKA logo"
```

---

## Self-Review Notes

- **Spec coverage:** Section 1 (SVG tooling + `PlakaIcon`) → Task 1. Section 2 (`AppTabBar` mapping) → Task 2. Section 3 (app icon/splash + `app.json` colors) → Task 3. The spec's testing section originally proposed adding a Jest `\.svg$` transform entry; Task 1 Step 5 instead mocks the raw `.svg` imports directly, which achieves the same goal (testing `PlakaIcon` without needing Metro) more safely — editing `jest.config.js`'s `transform` map risks silently overriding `jest-expo`'s carefully-built transform config for every other file in the suite, since Jest doesn't deep-merge a user-supplied `transform` key with a preset's. This refinement was found while writing this plan, not during brainstorming, and doesn't change any user-facing behavior from the approved spec.
- **Placeholder scan:** no TBDs; all code blocks are complete and were exercised (the icon-generation logic was run against the real source file during planning and its output visually inspected).
- **Type consistency:** `PlakaIconName` and `PlakaIcon`'s prop shape are defined once in Task 1 and consumed as-is (same name, same 4 literal values used) in Task 2's `AppTabBar.tsx` edits.
- **Scope:** single cohesive feature (icon set + logo), not decomposed further — matches the approved spec's scope.
