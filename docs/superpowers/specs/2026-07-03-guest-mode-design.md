# Modo invitado — diseño

## Contexto

Con los 5 módulos del PRD (Dashboard, Mascotas, Radar, Servicios, Settings)
ya auditados e implementados, queda pendiente el cambio transversal que se
había diferido durante toda la auditoría: permitir que alguien use partes
de la app sin crear una cuenta. El PRD funcional no describe explícitamente
un "modo invitado"; este spec define el alcance y la arquitectura desde
cero, en base a las decisiones tomadas con el usuario.

## Alcance

Un usuario invitado (sin cuenta) puede:

- **Radar**: ver el mapa/lista de mascotas perdidas y avistadas, y el
  detalle de un reporte.
- **Servicios**: ver el catálogo de categorías, proveedores, precios y
  disponibilidad.

Un usuario invitado **no** puede, sin iniciar sesión:

- Acceder a Dashboard (Inicio), Mascotas o Perfil.
- Crear un reporte de mascota perdida/callejera, ni marcar un avistamiento.
- Reservar un servicio, ni ver "Mis reservas".
- Cualquier otra acción de escritura dentro de Radar o Servicios.

## Entrada al modo invitado

Se agrega un link secundario **"Continuar sin cuenta"** en
`app/(auth)/sign-in.tsx`, junto a los botones de login existentes. Al
tocarlo:

1. Se llama a `useAuthStore.getState().enterGuestMode()`.
2. Se navega con `router.replace('/(app)')`.

No se pasa por `app/index.tsx` en este flujo — la navegación es directa,
así que no hace falta tocar la lógica de redirect basada en
`isAuthenticated` que vive ahí.

## Persistencia

`isGuest` vive **solo en memoria** (Zustand, sin persistir a
AsyncStorage). Si el usuario cierra y reabre la app, siempre vuelve a
`sign-in` — nunca se reabre automáticamente en modo invitado. Esto
mantiene `app/index.tsx` sin cambios: su única fuente de verdad sigue
siendo la sesión persistida.

## Arquitectura

### Estado: `src/stores/authStore.ts`

- Nuevo campo `isGuest: boolean` (default `false`).
- Nueva acción `enterGuestMode(): void` — pone `isGuest: true`.
- `clearAuth()` también resetea `isGuest` a `false` (logout desde modo
  invitado, o logout normal, dejan el store en el mismo estado limpio).

### Tab bar: `src/components/navigation/AppTabBar.tsx`

Lee `isGuest` desde el store. Para las rutas `index` (Inicio), `pets`
(Mascotas) y `profile` (Perfil):

- Si `isGuest`, el `onPress` de esa tab **no navega** — en su lugar llama
  a `requireAuth()` del hook de gate (ver abajo), que abre el modal.
- Las tabs `map` (Radar) y `services` (Servicios) navegan siempre
  normalmente, sean invitados o no.

Las 5 tabs permanecen visibles en ambos modos (decisión ya tomada): no
hay una tab bar "reducida" para invitados.

### Hook reutilizable: `src/hooks/useGuestGate.ts`

Único punto de gating para toda la app. Expone:

```ts
function useGuestGate(): {
  isGuest: boolean;
  requireAuth: (action: () => void) => void;
  GuestGateModal: () => React.JSX.Element | null;
};
```

- `requireAuth(action)`: si `isGuest` es `false`, ejecuta `action()` de
  inmediato. Si es `true`, no ejecuta `action` y en su lugar abre el
  modal (estado local `visible` dentro del hook).
- `GuestGateModal`: componente que el consumidor debe renderizar en su
  propio árbol (no hay overlay global ni contexto de React). Envuelve
  `AuthRequiredModal` con el estado `visible`/`onClose` que maneja el
  hook internamente.

Cada pantalla o botón que necesite gating importa este hook una vez y
llama `requireAuth(() => { ...acción real... })` en el `onPress`
correspondiente.

### Modal: `src/components/auth/AuthRequiredModal.tsx`

`Modal` nativo de RN (mismo patrón que los modales ya existentes en
`app/(app)/profile/settings.tsx`). Contenido:

- Mensaje: "Esto solo está disponible si inicias sesión."
- Botón primario **"Iniciar sesión"** → `router.push('/(auth)/sign-in')`.
- Link secundario **"Crear cuenta"** → `router.push('/(auth)/sign-up')`.
- Cierre (X o tap fuera) que solo oculta el modal, sin navegar.

### Puntos de integración identificados

- `src/components/navigation/AppTabBar.tsx` — tabs Inicio/Mascotas/Perfil.
- `app/(app)/map.tsx` — FAB de crear reporte (`testID="map.fab"`).
- `app/(app)/reports/[id].tsx` — flujo de marcar avistamiento y cualquier
  acción de contacto/edición sobre un reporte ajeno.
- `app/(app)/reports/[id]/edit.tsx` — edición de reporte propio (defensivo;
  un invitado no debería llegar aquí, pero se gatea igual).
- `app/(app)/services/[categoryId]/book.tsx` — submit de reserva
  (`testID="services.book.submit"`).
- `app/(app)/services/bookings.tsx` — pantalla completa de "Mis reservas"
  (requiere cuenta por completo, se gatea al entrar).

La lista exacta de botones/pantallas a envolver con `requireAuth` se
termina de mapear durante la implementación; el principio es: **toda
lectura en Radar/Servicios queda abierta, toda escritura requiere
cuenta**.

## Fuera de alcance

- Persistir el modo invitado entre sesiones (decisión explícita: no).
- Datos de ejemplo/mock para Dashboard, Mascotas o Perfil en modo
  invitado — esas pantallas simplemente no son alcanzables sin cuenta.
- Cambiar el flujo de autenticación real (sign-in/sign-up) más allá de
  agregar el link "Continuar sin cuenta".

## Testing

- Unit: `authStore.enterGuestMode()` / `clearAuth()` resetean `isGuest`
  correctamente.
- Unit: `useGuestGate().requireAuth()` ejecuta la acción cuando
  `isGuest` es `false`, y abre el modal (sin ejecutar la acción) cuando
  es `true`.
- Component: `AppTabBar` en modo invitado — tap en Inicio/Mascotas/Perfil
  no navega y muestra el modal; tap en Radar/Servicios sí navega.
- Component: FAB de `map.tsx` y submit de `book.tsx` en modo invitado
  abren el modal en vez de ejecutar la acción real.
- E2E/manual: flujo completo "Continuar sin cuenta" → explorar Radar →
  tocar "reportar" → modal → "Iniciar sesión" → sign-in real.
