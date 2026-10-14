export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  featured?: boolean;
}

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export interface Order {
  id: string;
  userId: string;
  items: import("./cartItem.types").CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}
