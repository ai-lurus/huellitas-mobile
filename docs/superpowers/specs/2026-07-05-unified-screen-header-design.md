# Header unificado para huellitas-mobile

## Problema

En `huellitas-mobile` cada pantalla arma su propio header a mano (no existe un
componente compartido). Esto produce inconsistencia visible:

- Dos estilos distintos conviven hoy: círculo con flecha `chevron-back` +
  título centrado (el más común: `reports/[id]/edit.tsx`, `pets/[id]/edit.tsx`,
  etc.) vs. logo de marca + texto "Volver" (`profile/settings.tsx`).
- Varias pantallas raíz de tab (`pets/index`, `map`, `services`,
  `profile/index` vía `settings.tsx`) tienen su propio top bar ad hoc, sin
  reutilizar nada entre sí.
- El código de header (estilos `headerRow`, `backCircle`, `headerTitle`,
  `headerSpacer`, etc.) está duplicado en ~25 archivos de pantalla.

Todas las pantallas del área autenticada (`app/(app)/**`) tienen
`headerShown: false` a nivel de `Stack`/`Tabs`, por lo que el header es
enteramente responsabilidad de cada screen — no hay header nativo de
expo-router en juego.

## Objetivo

Unificar el header en todas las pantallas del área autenticada mediante un
único componente compartido `ScreenHeader`, con dos modos visuales según si
la pantalla es raíz de un tab o una pantalla interna con navegación hacia
atrás.

## Fuera de alcance

- **Auth** (`sign-in`, `sign-up`, onboarding steps 1-3, oauth callbacks): flujo
  previo al login con diseño propio (progreso de onboarding, branding de
  bienvenida). No forma parte de este trabajo.
- **4 pantallas de éxito/confeti** (`reports/success(.web)`,
  `reports/[id]/found-success(.web)`): auto-redirigen a los 3.2s, son splashes
  de celebración sin navegación normal. Se quedan sin header a propósito.
- **`HomeHeader`** (usado en `app/(app)/index.tsx`): ya tiene diseño propio
  (buscador + campana de notificaciones). No se toca.
- **`PetProfileHeader`** (usado en `pets/[id].tsx`): header "hero" con foto de
  portada de la mascota; ya usa el ícono `chevron-back` sobre la imagen. No se
  toca — es un caso especial de diseño, no una inconsistencia a corregir.

## Diseño del componente

Nuevo archivo: `src/components/navigation/ScreenHeader.tsx` (junto a
`AppTabBar`, que ya vive en esa carpeta).

```ts
export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  testID?: string;
}
```

**Modo "detail"** — se activa cuando se pasa `onBack`:

- Círculo de 40×40, `borderRadius: 20`, `backgroundColor: colors.primary`.
- Ícono `Ionicons name="chevron-back" size={22} color={colors.white}`.
- Título centrado: `flex: 1`, `textAlign: 'center'`, estilo `typography.heading`.
- A la derecha: `rightSlot` si se pasa, o un espaciador de 40px para balancear
  el layout (mismo patrón que el `headerSpacer` que ya existe hoy en
  `reports/[id]/edit.tsx`).
- testIDs: `${testID}.back` y `${testID}.title` (default `testID="screenHeader"`).

**Modo "root"** — sin `onBack`:

- Logo de marca (`assets/icon.png`) + `title` a la izquierda.
- `rightSlot` a la derecha para la acción propia de cada tab.

El componente maneja su propio `paddingTop` según safe area (mismo criterio
que usan hoy los headers existentes), para no requerir que cada screen
envuelva en `SafeAreaView` solo por el header.

## Rollout por pantalla

**Se quedan como están** (ver "Fuera de alcance" + estos dos):

- `GroupHeader` — se revisa si ya cumple el estándar visual; si no, se ajusta
  para usar el mismo lenguaje visual del modo "detail" (puede seguir siendo
  su propio componente si tiene necesidades específicas de grupo).

**Migran a modo "root":**

- `pets/index.tsx` → título "Mis mascotas", avatar como `rightSlot`.
- `map.tsx` → título "Radar".
- `services.tsx` → título "Servicios".
- `profile/settings.tsx` cuando `showBack=false` (usado como root del tab
  Perfil vía `profile/index.tsx`).

**Migran a modo "detail"** (reemplazan su header inline actual —sea el patrón
círculo+título ya existente o el patrón logo+"Volver"— por
`<ScreenHeader title="..." onBack={...} rightSlot={...} />`, eliminando los
estilos de header duplicados de cada archivo):

`notifications`, `pets/limit`, `pets/new`, `pets/[id]/edit`,
`pets/[id]/found`, `pets/[id]/qr`, `places/new`, `places/[id]`,
`groups/index`, `groups/[id]`, `profile/settings.tsx` (cuando `showBack=true`),
`profile/reports`, `profile/[id]`, `feed/new-post`, `feed/[id]`, `stray/[id]`,
`routes/index`, `routes/new`, `routes/[id]`, `services/bookings`,
`services/[categoryId]/index`, `services/[categoryId]/book`,
`services/[categoryId]/providers`, `radar/report/new`, `reports/[id]`,
`reports/[id]/edit`, `reports/[id]/sighting`, `reports/[id]/found`,
`reports/[id]/map`.

## Testing

- Test unitario de `ScreenHeader`: render de título, `onPress` del botón de
  volver invoca `onBack`, `rightSlot` se renderiza en ambos modos, modo root
  vs. detail se selecciona correctamente según presencia de `onBack`.
- No hay tests existentes atados a los testIDs actuales de header/back
  (verificado por grep en `__tests__/`), así que estandarizar testIDs no
  rompe ninguna suite.
- Es un refactor visual/estructural, no cambia lógica de negocio — no se
  agregan tests nuevos por pantalla migrada, pero se corre la suite completa
  al final para confirmar que nada se rompió.
