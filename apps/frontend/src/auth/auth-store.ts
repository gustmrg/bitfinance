import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OrganizationState {
  selectedOrganizationId: string | null;
  setSelectedOrganizationId: (id: string | null) => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      selectedOrganizationId: null,
      setSelectedOrganizationId: (selectedOrganizationId) => set({ selectedOrganizationId }),
    }),
    {
      name: "bitfinance-preferences",
      partialize: (state) => ({ selectedOrganizationId: state.selectedOrganizationId }),
    },
  ),
);
