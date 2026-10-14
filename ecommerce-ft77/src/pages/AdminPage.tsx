import { useRef, useState, type FormEvent } from "react";
import { formatPrice } from "../services/demoStore";
import { uploadProductImage } from "../services/s3Upload";
import { isFirebaseConfigured } from "../config/firebase";
import type { Order, OrderStatus, Product } from "../types/product.types";

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  onProductsChange: (products: Product[]) => Promise<void>;
  onOrdersChange: (orders: Order[]) => Promise<void>;
  onClose: () => void;
  error?: string;
}

const emptyForm = { name: "", description: "", category: "Ropa", price: "", stock: "", imageUrl: "" };

export function AdminPage({ products, orders, onProductsChange, onOrdersChange, onClose, error = "" }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({ name: product.name, description: product.description, category: product.category, price: String(product.price), stock: String(product.stock), imageUrl: product.imageUrl });
    setImageFile(null);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadingImage(true);
    let imageUrl = form.imageUrl.trim();
    try {
      if (imageFile) imageUrl = await uploadProductImage(imageFile);
      const next: Product = { id: editingId ?? crypto.randomUUID(), name: form.name.trim(), description: form.description.trim(), category: form.category.trim(), price: Number(form.price), stock: Number(form.stock), imageUrl };
      await onProductsChange(editingId ? products.map((product) => product.id === editingId ? next : product) : [next, ...products]);
    } catch {
      setMessage("No se pudo guardar el producto o subir la imagen. Revisa la configuración de S3 y Firestore.");
      setUploadingImage(false);
      return;
    }
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    if (imageInput.current) imageInput.current.value = "";
    setUploadingImage(false);
    setMessage(editingId ? "Producto actualizado." : "Producto agregado.");
    window.setTimeout(() => setMessage(""), 2500);
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`¿Eliminar “${product.name}” del catálogo?`)) return;
    try { await onProductsChange(products.filter((item) => item.id !== product.id)); }
    catch { setMessage("No se pudo eliminar el producto. Revisa los permisos de Firestore."); }
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    try { await onOrdersChange(orders.map((order) => order.id === orderId ? { ...order, status } : order)); }
    catch { setMessage("No se pudo actualizar el estado de la orden."); }
  }

  const visibleOrders = orders.filter((order) => statusFilter === "all" || order.status === statusFilter);

  return <main className="admin-page">
    <header className="admin-header"><div><p className="eyebrow">SPIDERSHOP · BACK OFFICE</p><h1>Administración</h1></div><button className="button button-dark" onClick={onClose}>Volver a la tienda ↗</button></header>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <div className="demo-banner"><strong>{isFirebaseConfigured ? "Datos en Firestore." : "Modo local de demostración."}</strong> {isFirebaseConfigured ? "Productos y órdenes se guardan en la base de datos del proyecto." : "Configura Firebase para guardar cambios en la nube."}</div>
    <div className="admin-tabs"><button className={activeTab === "products" ? "selected" : ""} onClick={() => setActiveTab("products")}>Productos <span>{products.length}</span></button><button className={activeTab === "orders" ? "selected" : ""} onClick={() => setActiveTab("orders")}>Órdenes <span>{orders.length}</span></button></div>
    {message && <p className="admin-message" role="status">{message}</p>}
    {activeTab === "products" ? <div className="admin-layout"><section className="admin-list"><div className="admin-list-heading"><h2>Catálogo</h2><span>{products.length} productos</span></div>{products.length === 0 ? <p className="admin-empty">No hay productos. Crea el primero con el formulario.</p> : products.map((product) => <article className="admin-product" key={product.id}><img src={product.imageUrl} alt="" /><div><strong>{product.name}</strong><small>{product.category} · Stock {product.stock}</small><span>{formatPrice(product.price)}</span></div><div className="admin-product-actions"><button onClick={() => startEdit(product)}>Editar</button><button onClick={() => removeProduct(product)}>Eliminar</button></div></article>)}</section>
      <form className="admin-form" onSubmit={saveProduct}><p className="eyebrow">{editingId ? "EDITAR ARTÍCULO" : "NUEVO ARTÍCULO"}</p><h2>{editingId ? "Actualizar producto" : "Agregar producto"}</h2><label>Nombre<input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Descripción<textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><div className="form-row"><label>Categoría<input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label><label>Precio (COP)<input required type="number" min="1" step="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label></div><div className="form-row"><label>Stock<input required type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label><label>Imagen del producto<input ref={imageInput} required={!editingId} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} /></label></div>{editingId && <p className="form-hint">Si no seleccionas otra imagen, se conserva la actual.</p>}<p className="form-hint">Formatos JPG, PNG o WEBP; máximo 5 MB. La imagen se subirá a S3.</p><div className="form-actions"><button className="button button-dark" type="submit" disabled={uploadingImage}>{uploadingImage ? "Subiendo imagen…" : editingId ? "Guardar cambios" : "Crear producto"}</button>{editingId && <button className="button button-light" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setImageFile(null); if (imageInput.current) imageInput.current.value = ""; }}>Cancelar</button>}</div></form>
    </div> : <section className="orders-admin"><div className="orders-heading"><div><h2>Órdenes</h2><p>Órdenes guardadas por los usuarios autenticados.</p></div><label>Estado<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">Todos</option><option value="pending">Pendiente</option><option value="processing">En proceso</option><option value="completed">Completada</option><option value="cancelled">Cancelada</option></select></label></div>{visibleOrders.length === 0 ? <div className="admin-empty">No hay órdenes para mostrar.</div> : <div className="order-table"><div className="order-table-head"><span>Orden</span><span>Fecha</span><span>Productos</span><span>Total</span><span>Estado</span></div>{visibleOrders.map((order) => <article key={order.id} className="order-row"><strong>#{order.id.slice(0, 8)}</strong><span>{new Date(order.createdAt).toLocaleDateString("es-CO")}</span><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} artículos</span><strong>{formatPrice(order.total)}</strong><select aria-label={`Estado de la orden ${order.id.slice(0, 8)}`} value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}><option value="pending">Pendiente</option><option value="processing">En proceso</option><option value="completed">Completada</option><option value="cancelled">Cancelada</option></select></article>)}</div>}</section>}
  </main>;
}

