import { beforeEach, describe, expect, it, vi } from "vitest";
import { testProduct } from "./fixtures";
import type { Order, Product } from "../types/product.types";

const mocks = vi.hoisted(() => ({
  firestore: {} as unknown,
  collection: vi.fn((db, name) => ({ db, name })),
  doc: vi.fn((db, collectionName, id) => ({ db, collectionName, id })),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn((...args) => ({ args })),
  setDoc: vi.fn(),
  where: vi.fn((...args) => ({ args })),
  readOrders: vi.fn<() => Order[]>(() => []),
  readProducts: vi.fn<() => Product[]>(() => []),
  saveOrders: vi.fn(),
  saveProducts: vi.fn(),
}));
vi.mock("firebase/firestore", () => ({
  collection: mocks.collection, deleteDoc: mocks.deleteDoc, doc: mocks.doc,
  getDocs: mocks.getDocs, query: mocks.query, setDoc: mocks.setDoc, where: mocks.where,
}));
vi.mock("../config/firebase", () => ({ get firestore() { return mocks.firestore; } }));
vi.mock("../services/demoStore", () => ({
  readOrders: mocks.readOrders, readProducts: mocks.readProducts,
  saveOrders: mocks.saveOrders, saveProducts: mocks.saveProducts,
}));

async function loadStore() {
  vi.resetModules();
  return import("../services/firestoreStore");
}

const testOrder = { id: "order-1", userId: "customer-1", items: [{ product: testProduct, quantity: 1 }], total: testProduct.price, status: "pending" as const, createdAt: "2026-01-15T00:00:00.000Z" };
const orderOlder = { ...testOrder, id: "older", createdAt: "2026-01-01T00:00:00.000Z" };
const orderNewer = { ...testOrder, id: "newer", createdAt: "2026-02-01T00:00:00.000Z" };

describe("acceso a datos de productos y órdenes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.firestore = { name: "db" };
    vi.stubEnv("MODE", "production");
  });

  it("carga productos y conserva el id del documento", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [{ id: "p1", data: () => ({ ...testProduct, id: "ignored" }) }] });
    const store = await loadStore();
    await expect(store.loadProducts()).resolves.toEqual([{ ...testProduct, id: "p1" }]);
    expect(mocks.collection).toHaveBeenCalledWith(mocks.firestore, "products");
  });

  it("ordena todas las órdenes de la más reciente a la más antigua", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [orderOlder, orderNewer].map((order) => ({ id: order.id, data: () => order })) });
    const store = await loadStore();
    await expect(store.loadOrders()).resolves.toEqual([orderNewer, orderOlder]);
  });

  it("filtra y ordena las órdenes del usuario", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [orderOlder, orderNewer].map((order) => ({ id: order.id, data: () => order })) });
    const store = await loadStore();
    await expect(store.loadUserOrders("customer-1")).resolves.toEqual([orderNewer, orderOlder]);
    expect(mocks.where).toHaveBeenCalledWith("userId", "==", "customer-1");
    expect(mocks.query).toHaveBeenCalled();
  });

  it("guarda o reemplaza productos y órdenes, y elimina productos", async () => {
    const store = await loadStore();
    await store.saveProduct(testProduct);
    await store.saveOrder(testOrder);
    await store.removeProduct(testProduct.id);
    expect(mocks.setDoc).toHaveBeenNthCalledWith(1, expect.objectContaining({ collectionName: "products" }), testProduct);
    expect(mocks.setDoc).toHaveBeenNthCalledWith(2, expect.objectContaining({ collectionName: "orders" }), testOrder);
    expect(mocks.deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ collectionName: "products", id: testProduct.id }));
  });

  it("usa el almacenamiento local cuando Firebase está desactivado", async () => {
    mocks.firestore = null;
    mocks.readProducts.mockReturnValue([testProduct]);
    mocks.readOrders.mockReturnValue([orderOlder, orderNewer]);
    const store = await loadStore();
    await expect(store.loadProducts()).resolves.toEqual([testProduct]);
    await expect(store.loadOrders()).resolves.toEqual([orderOlder, orderNewer]);
    await expect(store.loadUserOrders(testOrder.userId)).resolves.toEqual([orderOlder, orderNewer]);
    await store.saveProduct(testProduct);
    await store.removeProduct(testProduct.id);
    await store.saveOrder(testOrder);
    expect(mocks.saveProducts).toHaveBeenCalledTimes(2);
    expect(mocks.saveOrders).toHaveBeenCalledWith([testOrder, orderOlder, orderNewer]);
  });
});



