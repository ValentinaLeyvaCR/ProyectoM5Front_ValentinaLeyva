import { createContext } from "react";
import type { CartContextValue } from "./CartContext.types";

export const CartContext = createContext<CartContextValue | null>(null);
