import { describe, expect, it } from "vitest";
import { cartReducer } from "../contexts/cart/CartReducer";
import { testProduct } from "./fixtures";

describe("cartReducer", () => {
  it("agrega productos y limita la cantidad al stock", () => {
    const oneItem = cartReducer([], { type: "add", product: testProduct });
    const twoItems = cartReducer(oneItem, { type: "add", product: testProduct });
    const capped = cartReducer(twoItems, { type: "setQuantity", productId: testProduct.id, quantity: 10 });

    expect(capped).toEqual([{ product: testProduct, quantity: 3 }]);
  });

  it("elimina un producto cuando se quita o se reduce a cero", () => {
    const cart = [{ product: testProduct, quantity: 1 }];

    expect(cartReducer(cart, { type: "setQuantity", productId: testProduct.id, quantity: 0 })).toEqual([]);
    expect(cartReducer(cart, { type: "remove", productId: testProduct.id })).toEqual([]);
  });

  it("vacía el carrito", () => {
    expect(cartReducer([{ product: testProduct, quantity: 2 }], { type: "clear" })).toEqual([]);
  });
});
