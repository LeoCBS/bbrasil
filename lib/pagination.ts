export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PageRange = {
  page: number;
  pageSize: number;
  from: number;
  to: number;
};

export function parsePageParam(value?: string) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function pageRange(page: number, pageSize: number): PageRange {
  const safePageSize = Math.max(1, pageSize);
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * safePageSize;

  return { page: safePage, pageSize: safePageSize, from, to: from + safePageSize - 1 };
}

export function totalPagesFor(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}

export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const safePageSize = Math.max(1, pageSize);
  const total = items.length;
  const totalPages = totalPagesFor(total, safePageSize);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = (safePage - 1) * safePageSize;

  return {
    items: items.slice(from, from + safePageSize),
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages
  };
}

export function buildHref(basePath: string, params: Record<string, string | number | undefined>, page = 1) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();

  return query ? `${basePath}?${query}` : basePath;
}

export function pageWindow(page: number, totalPages: number, radius = 2): (number | "dots")[] {
  const pages: (number | "dots")[] = [];
  const start = Math.max(1, page - radius);
  const end = Math.min(totalPages, page + radius);

  if (start > 1) {
    pages.push(1);

    if (start > 2) {
      pages.push("dots");
    }
  }

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push("dots");
    }

    pages.push(totalPages);
  }

  return pages;
}
