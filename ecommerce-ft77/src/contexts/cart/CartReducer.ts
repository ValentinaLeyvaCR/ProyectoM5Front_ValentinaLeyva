import type { CartItem } from "../../types/cartItem.types";
import type { CartAction } from "./CartContext.types";

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "add": {
      const found = state.find((item) => item.product.id === action.product.id);
      if (!found) return [...state, { product: action.product, quantity: 1 }];
      return state.map((item) => item.product.id === action.product.id
        ? { ...item, quantity: Math.min(item.quantity + 1, item.product.stock) }
        : item);
    }
    case "remove": return state.filter((item) => item.product.id !== action.productId);
    case "setQuantity": {
      if (action.quantity < 1) return state.filter((item) => item.product.id !== action.productId);
      return state.map((item) => item.product.id === action.productId
        ? { ...item, quantity: Math.min(action.quantity, item.product.stock) }
        : item);
    }
    case "clear": return [];
    default: return state;
  }
}
