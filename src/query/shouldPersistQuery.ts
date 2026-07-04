import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core';

/**
 * Derivado del propio tipo esperado por `persistOptions.dehydrateOptions.shouldDehydrateQuery`
 * en lugar de importar `Query` de `@tanstack/query-core` directamente: ese paquete existe
 * duplicado (uno anidado dentro de query-persist-client-core), y TypeScript trata sus
 * clases `Query` como tipos nominales distintos por el uso de campos `#private`.
 */
type DehydrateOptions = NonNullable<PersistQueryClientOptions['dehydrateOptions']>;
type ShouldDehydrateQuery = NonNullable<DehydrateOptions['shouldDehydrateQuery']>;
type PersistableQuery = Parameters<ShouldDehydrateQuery>[0];

/**
 * Excluye las queries de mascotas (namespace 'pets', debe coincidir con
 * PETS_QUERY_KEY/petQueryKey en hooks/usePets.ts) del caché persistido en
 * AsyncStorage. El persister guarda hasta 24h de antigüedad y se rehidrata
 * de forma síncrona al abrir la app, antes de cualquier refetch; pantallas
 * como pets/new.tsx deciden si mostrar el límite de mascotas apenas se monta
 * la query, así que un conteo restaurado y desactualizado puede bloquear al
 * usuario aunque el servidor ya tenga el número correcto.
 */
export function shouldPersistQuery(query: PersistableQuery): boolean {
  if (query.queryKey[0] === 'pets') return false;
  return query.state.status === 'success';
}
