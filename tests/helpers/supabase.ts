import { vi, type Mock } from "vitest";

export type QueryResult = {
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
};

export type QueryCall = { method: string; args: unknown[] };

/**
 * Minimal stand-in for the chainable postgrest query builder used by the
 * supabase client. Every filter/modifier returns the builder itself and the
 * builder resolves to the configured result when awaited.
 */
export class QueryBuilderStub implements PromiseLike<QueryResult> {
  readonly calls: QueryCall[] = [];

  constructor(private readonly result: QueryResult) {}

  private record(method: string, args: unknown[]) {
    this.calls.push({ method, args });
    return this;
  }

  select(...args: unknown[]) {
    return this.record("select", args);
  }

  order(...args: unknown[]) {
    return this.record("order", args);
  }

  eq(...args: unknown[]) {
    return this.record("eq", args);
  }

  or(...args: unknown[]) {
    return this.record("or", args);
  }

  ilike(...args: unknown[]) {
    return this.record("ilike", args);
  }

  limit(...args: unknown[]) {
    return this.record("limit", args);
  }

  range(...args: unknown[]) {
    return this.record("range", args);
  }

  insert(...args: unknown[]) {
    return this.record("insert", args);
  }

  update(...args: unknown[]) {
    return this.record("update", args);
  }

  delete(...args: unknown[]) {
    return this.record("delete", args);
  }

  maybeSingle() {
    this.record("maybeSingle", []);
    return Promise.resolve(this.result);
  }

  callsFor(method: string) {
    return this.calls.filter((call) => call.method === method).map((call) => call.args);
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

export type StorageStub = {
  upload: Mock;
  getPublicUrl: Mock;
};

export type SupabaseStub = {
  client: {
    from: Mock;
    storage: { from: Mock };
  };
  builder: QueryBuilderStub;
  storage: StorageStub;
};

export function createSupabaseStub(
  result: QueryResult = { data: [], error: null, count: 0 },
  storageResult: { uploadError?: { message: string } | null; publicUrl?: string } = {}
): SupabaseStub {
  const builder = new QueryBuilderStub(result);
  const storage: StorageStub = {
    upload: vi.fn(async () => ({ data: { path: "path" }, error: storageResult.uploadError ?? null })),
    getPublicUrl: vi.fn(() => ({ data: { publicUrl: storageResult.publicUrl ?? "https://cdn.test/image.png" } }))
  };

  return {
    builder,
    storage,
    client: {
      from: vi.fn(() => builder),
      storage: { from: vi.fn(() => storage) }
    }
  };
}

export function setSupabaseEnv({ url = "https://project.supabase.co", serviceKey = "service-key" } = {}) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = url;
  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
}

export function clearSupabaseEnv() {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
}
