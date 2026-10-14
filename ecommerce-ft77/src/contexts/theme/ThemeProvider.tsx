import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeContext } from "./ThemeContext";
import type { Theme } from "./ThemeContext.types";
const THEME_KEY = "spidershop-theme";
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");
  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); localStorage.setItem(THEME_KEY, theme); }, [theme]);
  const value = useMemo(() => ({ theme, toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light") }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
