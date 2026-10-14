import { useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { CartItem } from "../../types/cartItem.types";
import { CartContext } from "./CartContext";
import { cartReducer } from "./CartReducer";

const CART_KEY = "spidershop-cart-v1";

function readInitialCart(): CartItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    return Array.isArray(value) ? value as CartItem[] : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, readInitialCart);
  useEffect(() => localStorage.setItem(CART_KEY, JSON.stringify(items)), [items]);
  const value = useMemo(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    dispatch,
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
