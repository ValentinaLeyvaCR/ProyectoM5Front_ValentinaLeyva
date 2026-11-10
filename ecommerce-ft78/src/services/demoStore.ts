import type { Order, Product } from "../types/product.types";

const PRODUCTS_KEY = "spidershop-demo-products-v1";
const ORDERS_KEY = "spidershop-demo-orders";

export const initialProducts: Product[] = [
  { id: "tee-classic", name: "Camiseta esencial", description: "Algodón suave para todos los días, con un corte cómodo y atemporal.", category: "Ropa", price: 59900, stock: 18, imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85", featured: true },
  { id: "bag-city", name: "Mochila City", description: "Espacio para tus esenciales, bolsillos prácticos y estilo urbano.", category: "Accesorios", price: 129900, stock: 7, imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85", featured: true },
  { id: "sneaker-red", name: "Tenis Pulse", description: "Diseñados para acompañarte con comodidad dentro y fuera de casa.", category: "Calzado", price: 189900, stock: 12, imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27b0?auto=format&fit=crop&w=900&q=85", featured: false },
  { id: "headphones-air", name: "Audífonos Air", description: "Sonido envolvente y conexión inalámbrica para tu ritmo.", category: "Tecnología", price: 149900, stock: 5, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85", featured: true },
  { id: "watch-everyday", name: "Reloj Everyday", description: "Un diseño limpio y versátil para combinar con todo.", category: "Accesorios", price: 99900, stock: 9, imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85", featured: false },
  { id: "cap-urban", name: "Gorra Urban", description: "Visera curva y ajuste cómodo para tus planes al aire libre.", category: "Accesorios", price: 45900, stock: 21, imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c8bfc6df?auto=format&fit=crop&w=900&q=85", featured: false },
];

export const formatPrice = (amount: number): string =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount);

function readJson<T>(key: string, fallback: T): T {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    return value === null ? fallback : value as T;
  } catch {
    return fallback;
  }
}

export const readProducts = (): Product[] => readJson(PRODUCTS_KEY, initialProducts);
export const saveProducts = (products: Product[]): void => localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
export const readOrders = (): Order[] => readJson(ORDERS_KEY, []);
export const saveOrders = (orders: Order[]): void => localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
