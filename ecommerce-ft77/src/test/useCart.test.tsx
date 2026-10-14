import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { CartProvider } from "../contexts/cart/CartProvider";
import { useCart } from "../contexts/cart/useCart";
import { testProduct } from "./fixtures";

function wrapper({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

describe("useCart", () => {
  it("expone el conteo y total después de agregar un producto", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.dispatch({ type: "add", product: testProduct }));

    expect(result.current.count).toBe(1);
    expect(result.current.total).toBe(50000);
  });
});
