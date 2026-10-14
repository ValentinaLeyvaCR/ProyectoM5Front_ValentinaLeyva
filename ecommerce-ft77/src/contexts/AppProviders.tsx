import type { ReactNode } from "react";
import { AuthProvider } from "./auth/AuthProvider";
import { CartProvider } from "./cart/CartProvider";
import { ThemeProvider } from "./theme/ThemeProvider";
export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider><AuthProvider><CartProvider>{children}</CartProvider></AuthProvider></ThemeProvider>;
}
