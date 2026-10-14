import type { Order } from "../types/product.types";
import { testProduct } from "./fixtures";
export const testOrder: Order = {
  id: "order-route", userId: "customer-1", items: [{ product: testProduct, quantity: 1 }],
  total: testProduct.price, status: "pending", createdAt: "2026-10-14T14:00:00.000Z",
};
