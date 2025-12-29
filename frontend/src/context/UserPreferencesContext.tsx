"use client";

import { createContext, useContext, ReactNode } from "react";
import { useLocalStorage } from "@mantine/hooks";

/** Interface untuk UserPreferencesContext */
interface UserPreferencesContextType {
  pageSize: number;
  setPageSize: (size: number) => void;
  PAGE_SIZES: number[];
}

// Context untuk menyimpan preferensi pengguna (seperti ukuran halaman tabel)
const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(
  undefined
);

export const PAGE_SIZES = [10, 25, 50, 100];

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [pageSize, setPageSize] = useLocalStorage({
    key: "user-preference-page-size",
    defaultValue: PAGE_SIZES[0],
    getInitialValueInEffect: true,
  });

  return (
    <UserPreferencesContext.Provider
      value={{
        pageSize,
        setPageSize,
        PAGE_SIZES,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

/**
 * Custom hook untuk mengakses UserPreferencesContext.
 * Mengembalikan { pageSize, setPageSize, PAGE_SIZES }.
 */
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider"
    );
  }
  return context;
}
