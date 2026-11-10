import type { CartItem } from "../../types/cartItem.types";
import type { Product } from "../../types/product.types";

export type CartAction =
  | { type: "add"; product: Product }
  | { type: "remove"; productId: string }
  | { type: "setQuantity"; productId: string; quantity: number }
  | { type: "clear" };

export interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  dispatch: (action: CartAction) => void;
}
