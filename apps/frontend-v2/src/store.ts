import { create } from "zustand";

import { demoBills, demoExpenses, demoMembers, demoOrganizations, demoUser } from "./mock-data";
import type { Bill, DemoState, Expense, Member, NewBillInput, NewExpenseInput, Organization, User } from "./types";

type DemoActions = {
  signIn: (user?: User) => void;
  signOut: () => void;
  setActiveOrganization: (id: string) => void;
  addBill: (input: NewBillInput) => void;
  updateBill: (id: string, changes: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  markBillPaid: (id: string) => void;
  addExpense: (input: NewExpenseInput) => void;
  updateExpense: (id: string, changes: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  updateOrganization: (id: string, changes: Partial<Organization>) => void;
  inviteMember: (email: string, role: Member["role"]) => void;
  updateProfile: (changes: Partial<User>) => void;
  resetDemo: () => void;
};

const initialState: DemoState = {
  user: demoUser,
  isAuthenticated: false,
  organizations: demoOrganizations,
  activeOrganizationId: "org-01",
  members: demoMembers,
  bills: demoBills,
  expenses: demoExpenses,
};

const nextId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

export const useDemoStore = create<DemoState & DemoActions>((set) => ({
  ...initialState,
  signIn: (user = demoUser) => set({ user, isAuthenticated: true }),
  signOut: () => set({ isAuthenticated: false }),
  setActiveOrganization: (id) => set({ activeOrganizationId: id }),
  addBill: (input) => set((state) => ({ bills: [{ ...input, id: nextId("bill"), status: "upcoming", amountPaid: null, paymentDate: null, occurrence: input.seriesType === "installment" ? 1 : null, seriesActive: Boolean(input.seriesType), documents: [] }, ...state.bills] })),
  updateBill: (id, changes) => set((state) => ({ bills: state.bills.map((bill) => (bill.id === id ? { ...bill, ...changes } : bill)) })),
  deleteBill: (id) => set((state) => ({ bills: state.bills.filter((bill) => bill.id !== id) })),
  markBillPaid: (id) => set((state) => ({ bills: state.bills.map((bill) => (bill.id === id ? { ...bill, status: "paid", amountPaid: bill.amountDue, paymentDate: new Date().toISOString() } : bill)) })),
  addExpense: (input) => set((state) => ({ expenses: [{ ...input, id: nextId("expense"), status: "paid", createdBy: state.user?.id ?? "user-01", documents: [] }, ...state.expenses] })),
  updateExpense: (id, changes) => set((state) => ({ expenses: state.expenses.map((expense) => (expense.id === id ? { ...expense, ...changes } : expense)) })),
  deleteExpense: (id) => set((state) => ({ expenses: state.expenses.filter((expense) => expense.id !== id) })),
  updateOrganization: (id, changes) => set((state) => ({ organizations: state.organizations.map((organization) => (organization.id === id ? { ...organization, ...changes } : organization)) })),
  inviteMember: (email, role) => set((state) => ({ members: [...state.members, { id: nextId("member"), email, role, name: email.split("@")[0] ?? "New member", joinedAt: new Date().toISOString(), initials: email.slice(0, 2).toUpperCase() }] })),
  updateProfile: (changes) => set((state) => ({ user: state.user ? { ...state.user, ...changes } : state.user })),
  resetDemo: () => set((state) => ({ ...initialState, isAuthenticated: state.isAuthenticated, user: state.user })),
}));

export const selectActiveOrganization = (state: DemoState) => state.organizations.find((organization) => organization.id === state.activeOrganizationId) ?? state.organizations[0];
