function getDateKey(value?: Date) {
  return value ? value.toISOString() : null;
}

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },
  organizations: {
    all: ["organizations"] as const,
    lists: () => [...queryKeys.organizations.all, "list"] as const,
    list: () => [...queryKeys.organizations.lists()] as const,
    detail: (organizationId: string) =>
      [...queryKeys.organizations.all, "detail", organizationId] as const,
  },
  bills: {
    all: ["bills"] as const,
    lists: () => [...queryKeys.bills.all, "list"] as const,
    listByOrganization: (organizationId: string) =>
      [...queryKeys.bills.lists(), organizationId] as const,
    list: (organizationId: string, from?: Date, to?: Date, status?: string[], description?: string) =>
      [
        ...queryKeys.bills.listByOrganization(organizationId),
        getDateKey(from),
        getDateKey(to),
        status?.slice().sort().join(",") ?? null,
        description ?? null,
      ] as const,
    detail: (organizationId: string, billId: string) =>
      [...queryKeys.bills.all, "detail", organizationId, billId] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    lists: () => [...queryKeys.expenses.all, "list"] as const,
    listByOrganization: (organizationId: string) =>
      [...queryKeys.expenses.lists(), organizationId] as const,
    list: (organizationId: string, from?: Date, to?: Date) =>
      [
        ...queryKeys.expenses.listByOrganization(organizationId),
        getDateKey(from),
        getDateKey(to),
      ] as const,
    detail: (organizationId: string, expenseId: string) =>
      [...queryKeys.expenses.all, "detail", organizationId, expenseId] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    upcomingBills: (organizationId: string) =>
      [...queryKeys.dashboard.all, "upcoming-bills", organizationId] as const,
    recentExpenses: (organizationId: string) =>
      [...queryKeys.dashboard.all, "recent-expenses", organizationId] as const,
  },
} as const;
