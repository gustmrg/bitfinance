const dateKey = (value?: Date | null) => value?.toISOString() ?? null;

export const queryKeys = {
  auth: { all: ["auth"] as const, me: () => ["auth", "me"] as const },
  health: { all: ["health"] as const },
  organizations: {
    all: ["organizations"] as const,
    list: () => ["organizations", "list"] as const,
    detail: (organizationId: string) => ["organizations", "detail", organizationId] as const,
    budget: (organizationId: string) => ["organizations", "budget", organizationId] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    summary: (organizationId: string, from?: Date, to?: Date) =>
      ["dashboard", "summary", organizationId, dateKey(from), dateKey(to)] as const,
    upcoming: (organizationId: string, from?: Date, to?: Date) =>
      ["dashboard", "upcoming", organizationId, dateKey(from), dateKey(to)] as const,
    recent: (organizationId: string, from?: Date, to?: Date) =>
      ["dashboard", "recent", organizationId, dateKey(from), dateKey(to)] as const,
  },
  bills: {
    all: ["bills"] as const,
    list: (
      organizationId: string,
      page: number,
      pageSize: number,
      from?: Date,
      to?: Date,
      status?: string,
      description?: string,
    ) =>
      [
        "bills",
        "list",
        organizationId,
        page,
        pageSize,
        dateKey(from),
        dateKey(to),
        status ?? null,
        description ?? null,
      ] as const,
    detail: (organizationId: string, billId: string) =>
      ["bills", "detail", organizationId, billId] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    list: (
      organizationId: string,
      page: number,
      pageSize: number,
      from?: Date,
      to?: Date,
      status?: string,
      description?: string,
      paymentMethod?: string,
    ) =>
      [
        "expenses",
        "list",
        organizationId,
        page,
        pageSize,
        dateKey(from),
        dateKey(to),
        status ?? null,
        description ?? null,
        paymentMethod ?? null,
      ] as const,
    detail: (organizationId: string, expenseId: string) =>
      ["expenses", "detail", organizationId, expenseId] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (organizationId: string) => ["notifications", organizationId, "list"] as const,
    unread: (organizationId: string) => ["notifications", organizationId, "unread"] as const,
    preferences: (organizationId: string) =>
      ["notifications", organizationId, "preferences"] as const,
  },
} as const;
