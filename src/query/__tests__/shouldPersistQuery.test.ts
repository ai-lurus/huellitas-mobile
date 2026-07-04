import { shouldPersistQuery } from '../shouldPersistQuery';

type PersistableQuery = Parameters<typeof shouldPersistQuery>[0];

const PETS_QUERY_KEY = ['pets'] as const;

function makeQuery(
  queryKey: readonly unknown[],
  status: 'success' | 'error' | 'pending' = 'success',
): PersistableQuery {
  return { queryKey, state: { status } } as unknown as PersistableQuery;
}

describe('shouldPersistQuery', () => {
  it('excludes the pets list query from persistence', () => {
    expect(shouldPersistQuery(makeQuery(PETS_QUERY_KEY))).toBe(false);
  });

  it('excludes pet detail queries (same "pets" namespace) from persistence', () => {
    expect(shouldPersistQuery(makeQuery(['pets', 'abc-123']))).toBe(false);
  });

  it('persists other successful queries by default', () => {
    expect(shouldPersistQuery(makeQuery(['lostReports']))).toBe(true);
  });

  it('does not persist queries that have not succeeded', () => {
    expect(shouldPersistQuery(makeQuery(['lostReports'], 'pending'))).toBe(false);
  });
});
