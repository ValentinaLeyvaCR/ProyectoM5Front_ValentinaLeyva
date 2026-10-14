import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartList } from "../components/common/CartList";
import { StoreLayout } from "../components/layouts/StoreLayout";
import { EmptyState } from "../components/ui/EmptyState";
import { Header } from "../components/common/header";
import { ProductList } from "../components/common/ProductList";
import { useCart } from "../contexts/cart/useCart";
import { useDebounce } from "../hooks/useDebounce";
import { formatPrice } from "../services/demoStore";
import { loadProducts, saveOrder } from "../services/firestoreStore";
import { useAuth } from "../contexts/auth/useAuth";
import { isFirebaseConfigured } from "../config/firebase";
import type { Order } from "../types/product.types";
import type { Product } from "../types/product.types";

export function HomePage() {
  const navigate = useNavigate();
  const { items, count, total, dispatch } = useCart();
  const { user, profile } = useAuth();
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim().toLocaleLowerCase("es"));
  const [category, setCategory] = useState("Todo");
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [notice, setNotice] = useState("");

  const categories = useMemo(() => ["Todo", ...new Set(catalog.map((product) => product.category))], [catalog]);
  const products = useMemo(() => catalog.filter((product) =>
    (category === "Todo" || product.category === category)
      && product.name.toLocaleLowerCase("es").includes(debouncedSearch),
  ), [catalog, category, debouncedSearch]);

  useEffect(() => {
    let active = true;
    loadProducts()
      .then((productsFromDatabase) => { if (active) setCatalog(productsFromDatabase); })
      .catch(() => { if (active) setCatalogError("No se pudo cargar el catálogo. Revisa la conexión con Firebase."); })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, []);
  function addToCart(product: Product) {
    dispatch({ type: "add", product });
    setNotice(`${product.name} se agregó al carrito`);
    window.setTimeout(() => setNotice(""), 2500);
  }

  async function checkout() {
    if (items.length === 0) return;
    const demoCheckout = !isFirebaseConfigured || import.meta.env.MODE === "test";
    if (!user && !demoCheckout) {
      setNotice("Inicia sesión para confirmar tu compra.");
      navigate("/login");
      return;
    }
    const order: Order = {
      id: crypto.randomUUID(), userId: user?.uid ?? "demo-customer", items, total,
      status: "pending", createdAt: new Date().toISOString(),
    };
    try {
      await saveOrder(order);
      dispatch({ type: "clear" });
      setCartOpen(false);
      if (user && profile?.role === "customer") {
        navigate("/orders");
        return;
      }
      setNotice("Compra de prueba confirmada. Tu orden quedó guardada.");
      window.setTimeout(() => setNotice(""), 4000);
    } catch {
      setNotice("No se pudo guardar la orden. Revisa tu conexión e inténtalo de nuevo.");
    }
  }

  return (
    <StoreLayout header={<Header cartCount={count} search={search} onSearchChange={setSearch} onOpenCart={() => setCartOpen(true)} onOpenAdmin={() => navigate("/admin")} />}>
      <main>
        <section className="products" id="productos">
          <div className="catalog-heading">
            <div><p className="catalog-kicker">SPIDERSHOP</p><h1>Nuestros productos</h1><p>Encuentra algo para ti.</p></div>
            <label className="category-control">Categoría
              <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoría">
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
          {catalogLoading ? <p className="empty-message" role="status">Cargando productos…</p>
            : catalogError ? <p className="empty-message" role="alert">{catalogError}</p>
            : products.length === 0
            ? <EmptyState message="No encontramos productos con esos filtros." />
            : <ProductList products={products} onAdd={addToCart} onSelect={setSelected} />}
        </section>
      </main>

      {notice && <div className="toast" role="status">{notice}</div>}
      {cartOpen && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
        <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Carrito de compras">
          <div className="drawer-heading"><h2>Mi carrito ({count})</h2><button className="close-button" onClick={() => setCartOpen(false)} aria-label="Cerrar carrito">×</button></div>
          {items.length === 0 ? <p className="empty-message">Tu carrito está vacío.</p> : <>
            <CartList items={items} dispatch={dispatch} />
            <div className="cart-summary"><p><span>Total</span><strong>{formatPrice(total)}</strong></p>
              <button className="site-header__button site-header__button--primary checkout-button" onClick={checkout}>Confirmar compra de prueba</button>
              <small>Pago simulado. La orden se guarda en Firestore.</small>
            </div>
          </>}
        </aside>
      </div>}
      {selected && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        <section className="detail-dialog" role="dialog" aria-modal="true" aria-label={`Detalle de ${selected.name}`}>
          <button className="close-button detail-close" onClick={() => setSelected(null)} aria-label="Cerrar detalle">×</button>
          <img src={selected.imageUrl} alt={selected.name} />
          <div><p className="product-card__stock">{selected.category}</p><h2>{selected.name}</h2><p>{selected.description}</p>
            <strong>{formatPrice(selected.price)}</strong><p className="product-card__stock">Stock: {selected.stock}</p>
            <button className="product-card__add" disabled={selected.stock < 1} onClick={() => { addToCart(selected); setSelected(null); }}>Agregar al carrito</button>
          </div>
        </section>
      </div>}
    </StoreLayout>
  );
}
