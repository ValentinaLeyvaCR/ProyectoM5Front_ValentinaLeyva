import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "../routes/AppRoutes";
import { loadOrders, loadProducts, removeProduct, saveOrder, saveProduct } from "../services/firestoreStore";
import { testProduct } from "./fixtures";
import { testOrder } from "./routeFixtures";

const auth = vi.hoisted(() => ({ value: {
  user: null as { uid: string } | null,
  profile: null as { uid: string; role: "admin" | "customer" } | null,
  loading: false,
} }));
vi.mock("../contexts/auth/useAuth", () => ({ useAuth: () => auth.value }));
vi.mock("../services/firestoreStore", () => ({
  loadOrders: vi.fn(), loadProducts: vi.fn(), removeProduct: vi.fn(), saveOrder: vi.fn(), saveProduct: vi.fn(),
}));
vi.mock("../pages/HomePage", () => ({ HomePage: () => <p>home-page</p> }));
vi.mock("../pages/AuthPage", () => ({ AuthPage: ({ mode }: { mode: string }) => <p>{mode}-page</p> }));
vi.mock("../pages/OrdersPage", () => ({ OrdersPage: () => <p>orders-page</p> }));
vi.mock("../pages/AdminPage", () => ({ AdminPage: (props: { error?: string; products: { id: string }[]; orders: { status: string }[]; onProductsChange: (products: { id: string }[]) => Promise<void>; onOrdersChange: (orders: { status: string }[]) => Promise<void>; onClose: () => void }) => <div>
  <p data-testid="admin-data">{props.error} {props.products.length} {props.orders.length}</p>
  <button onClick={() => void props.onProductsChange([...props.products, { ...props.products[0], id: "new-product" }])}>add-product</button>
  <button onClick={() => void props.onProductsChange([])}>remove-product</button>
  <button onClick={() => void props.onOrdersChange(props.orders.map((order) => ({ ...order, status: "processing" })))}>update-order</button>
  <button onClick={props.onClose}>close-admin</button>
</div> }));

function renderRoutes(path: string) { return render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>); }
function setAuth(role: "admin" | "customer" | null, loading = false) {
  auth.value = { user: role ? { uid: "u-1" } : null, profile: role ? { uid: "u-1", role } : null, loading };
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuth(null);
  vi.mocked(loadProducts).mockResolvedValue([testProduct]);
  vi.mocked(loadOrders).mockResolvedValue([testOrder]);
  vi.mocked(saveProduct).mockResolvedValue(undefined);
  vi.mocked(removeProduct).mockResolvedValue(undefined);
  vi.mocked(saveOrder).mockResolvedValue(undefined);
});

describe("rutas de la tienda y protección de administración", () => {
  it.each([["/login", "login-page"], ["/register", "register-page"], ["/orders", "orders-page"]])("muestra la ruta %s", (path, text) => {
    renderRoutes(path);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("redirige rutas desconocidas al inicio", () => {
    renderRoutes("/no-existe");
    expect(screen.getByText("home-page")).toBeInTheDocument();
  });

  it("espera la sesión y lleva a login a visitantes", async () => {
    setAuth(null, true);
    const { rerender } = renderRoutes("/admin");
    expect(screen.getByRole("status")).toHaveTextContent("Cargando sesión");
    setAuth(null);
    rerender(<MemoryRouter initialEntries={["/admin"]}><AppRoutes /></MemoryRouter>);
    expect(await screen.findByText("login-page")).toBeInTheDocument();
  });

  it("redirige a la tienda a los clientes que abren administración", async () => {
    setAuth("customer");
    renderRoutes("/admin");
    expect(await screen.findByText("home-page")).toBeInTheDocument();
    expect(loadProducts).not.toHaveBeenCalled();
  });

  it("carga datos de admin, guarda cambios de productos y órdenes, y cierra el panel", async () => {
    setAuth("admin");
    renderRoutes("/admin");
    expect(await screen.findByTestId("admin-data")).toHaveTextContent("1 1");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "add-product" })));
    await waitFor(() => expect(saveProduct).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "update-order" }));
    await waitFor(() => expect(saveOrder).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "remove-product" }));
    await waitFor(() => expect(removeProduct).toHaveBeenCalledWith(testProduct.id));
    fireEvent.click(screen.getByRole("button", { name: "close-admin" }));
    expect(await screen.findByText("home-page")).toBeInTheDocument();
  });

  it("informa errores al cargar los datos de administración", async () => {
    setAuth("admin");
    vi.mocked(loadOrders).mockRejectedValueOnce(new Error("offline"));
    renderRoutes("/admin");
    expect(await screen.findByTestId("admin-data")).toHaveTextContent("No se pudieron cargar los datos");
  });
});





