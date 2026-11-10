import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/auth/useAuth";
import { formatPrice } from "../services/demoStore";
import { loadUserOrders } from "../services/firestoreStore";
import type { Order, OrderStatus } from "../types/product.types";

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendiente",
  processing: "En proceso",
  completed: "Completada",
  cancelled: "Cancelada",
};

export function OrdersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || profile?.role !== "customer") return;
    let active = true;
    loadUserOrders(user.uid)
      .then((userOrders) => { if (active) setOrders(userOrders); })
      .catch(() => { if (active) setError("No se pudieron cargar tus compras. Revisa tu conexión e inténtalo de nuevo."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, profile?.role]);

  if (authLoading) return <p className="empty-message" role="status">Verificando tu sesión…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== "customer") return <Navigate to="/" replace />;

  return <main className="customer-orders">
    <header className="customer-orders__header">
      <div><p className="eyebrow">SPIDERSHOP · MI CUENTA</p><h1>Mis compras</h1><p>Consulta el estado y el resumen de tus órdenes.</p></div>
      <Link className="site-header__button site-header__button--primary" to="/">Volver a la tienda</Link>
    </header>
    {loading ? <p className="empty-message" role="status">Cargando tus compras…</p>
      : error ? <p className="auth-error" role="alert">{error}</p>
      : orders.length === 0 ? <section className="customer-orders__empty"><h2>Aún no tienes compras</h2><p>Cuando confirmes una compra, podrás consultar aquí su estado.</p><Link className="site-header__button site-header__button--primary" to="/">Ver productos</Link></section>
      : <section className="customer-orders__list" aria-label="Historial de compras">
        {orders.map((order) => <article className="customer-order" key={order.id}>
          <div className="customer-order__top">
            <div><p className="customer-order__label">Número de orden</p><h2>#{order.id.slice(0, 8)}</h2></div>
            <span className={`order-status order-status--${order.status}`}>{statusLabels[order.status]}</span>
          </div>
          <p className="customer-order__date">Fecha: {new Date(order.createdAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}</p>
          <ul className="customer-order__items">
            {order.items.map((item) => <li key={item.product.id}><span>{item.product.name} × {item.quantity}</span><strong>{formatPrice(item.product.price * item.quantity)}</strong></li>)}
          </ul>
          <div className="customer-order__total"><span>Total</span><strong>{formatPrice(order.total)}</strong></div>
        </article>)}
      </section>}
  </main>;
}
