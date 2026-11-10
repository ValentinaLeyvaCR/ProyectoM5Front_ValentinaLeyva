import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthPage } from "../pages/AuthPage";
import { AdminPage } from "../pages/AdminPage";
import { HomePage } from "../pages/HomePage";
import { OrdersPage } from "../pages/OrdersPage";
import { loadOrders, loadProducts, removeProduct as deleteProductFromStore, saveOrder, saveProduct } from "../services/firestoreStore";
import type { Order, Product } from "../types/product.types";
import { RequireAdmin } from "./RequireAdmin";

function AdminRoute() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([loadProducts(), loadOrders()])
      .then(([loadedProducts, loadedOrders]) => {
        if (active) { setProducts(loadedProducts); setOrders(loadedOrders); }
      })
      .catch(() => { if (active) setError("No se pudieron cargar los datos. Revisa Firebase y las reglas de Firestore."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function updateProducts(nextProducts: Product[]) {
    const nextIds = new Set(nextProducts.map((product) => product.id));
    const removed = products.filter((product) => !nextIds.has(product.id));
    const changed = nextProducts.filter((product) => JSON.stringify(products.find((item) => item.id === product.id)) !== JSON.stringify(product));
    await Promise.all([...changed.map(saveProduct), ...removed.map((product) => deleteProductFromStore(product.id))]);
    setProducts(nextProducts);
  }

  async function updateOrders(nextOrders: Order[]) {
    const changed = nextOrders.filter((order) => JSON.stringify(orders.find((item) => item.id === order.id)) !== JSON.stringify(order));
    await Promise.all(changed.map(saveOrder));
    setOrders(nextOrders);
  }

  if (loading) return <p className="empty-message" role="status">Cargando el panel…</p>;

  return <AdminPage
    products={products}
    orders={orders}
    onProductsChange={updateProducts}
    onOrdersChange={updateOrders}
    error={error}
    onClose={() => navigate("/")}
  />;
}

export function AppRoutes() {
  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/orders" element={<OrdersPage />} />
    <Route path="/admin" element={<RequireAdmin><AdminRoute /></RequireAdmin>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
