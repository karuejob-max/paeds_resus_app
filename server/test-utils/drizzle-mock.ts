import { vi } from "vitest";

export function createQueryable(rows: unknown[] = []) {
  const queryable: Record<string, unknown> = {
    limit: vi.fn().mockResolvedValue(rows),
    orderBy: vi.fn().mockResolvedValue(rows),
  };
  queryable.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(rows).then(resolve, reject);
  return queryable;
}

export function createMockDb(defaultRows: unknown[] = []) {
  const insertResult = [{ insertId: 1 }];
  const insertChain = {
    values: vi.fn().mockResolvedValue(insertResult),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };

  return {
    getDb: vi.fn().mockResolvedValue({
      insert: vi.fn().mockReturnValue(insertChain),
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => createQueryable(defaultRows)),
          orderBy: vi.fn().mockResolvedValue(defaultRows),
        })),
      })),
      update: vi.fn().mockReturnValue(insertChain),
      delete: vi.fn().mockReturnValue(insertChain),
    }),
  };
}
