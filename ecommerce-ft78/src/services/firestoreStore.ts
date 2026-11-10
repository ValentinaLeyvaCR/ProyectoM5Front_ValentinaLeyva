import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { firestore } from "../config/firebase";
import { readOrders, readProducts, saveOrders, saveProducts } from "./demoStore";
import type { Order, Product } from "../types/product.types";

function requireDatabase() {
  if (!firestore) throw new Error("Configura Firebase en el archivo .env para guardar los datos.");
  return firestore;
}

const useLocalStore = !firestore || import.meta.env.MODE === "test";

export async function loadProducts(): Promise<Product[]> {
  if (useLocalStore) return readProducts();
  const snapshot = await getDocs(collection(requireDatabase(), "products"));
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as Product);
}

export async function loadOrders(): Promise<Order[]> {
  if (useLocalStore) return readOrders();
  const snapshot = await getDocs(collection(requireDatabase(), "orders"));
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as Order)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function loadUserOrders(userId: string): Promise<Order[]> {
  if (useLocalStore) return readOrders().filter((order) => order.userId === userId);
  const ordersQuery = query(collection(requireDatabase(), "orders"), where("userId", "==", userId));
  const snapshot = await getDocs(ordersQuery);
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as Order)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveProduct(product: Product): Promise<void> {
  if (useLocalStore) {
    const products = readProducts();
    saveProducts([product, ...products.filter((item) => item.id !== product.id)]);
    return;
  }
  await setDoc(doc(requireDatabase(), "products", product.id), product);
}

export async function removeProduct(productId: string): Promise<void> {
  if (useLocalStore) {
    saveProducts(readProducts().filter((product) => product.id !== productId));
    return;
  }
  await deleteDoc(doc(requireDatabase(), "products", productId));
}

export async function saveOrder(order: Order): Promise<void> {
  if (useLocalStore) {
    const orders = readOrders();
    saveOrders([order, ...orders.filter((item) => item.id !== order.id)]);
    return;
  }
  await setDoc(doc(requireDatabase(), "orders", order.id), order);
}
