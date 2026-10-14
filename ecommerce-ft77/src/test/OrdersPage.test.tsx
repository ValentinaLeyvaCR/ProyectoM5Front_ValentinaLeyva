import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../contexts/auth/useAuth";
import { loadUserOrders } from "../services/firestoreStore";
import { OrdersPage } from "../pages/OrdersPage";
import type { Order } from "../types/product.types";
import { testProduct } from "./fixtures";

vi.mock("../contexts/auth/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../services/firestoreStore", () => ({ loadUserOrders: vi.fn() }));

const customerUid = "customer-123";
const customerOrder: Order = {
  id: "order-abcdef12-3456",
  userId: customerUid,
  items: [{ product: testProduct, quantity: 2 }],
  total: testProduct.price * 2,
  status: "processing",
  createdAt: "2026-10-14T14:00:00.000Z",
};

function setAuth(role: "customer" | "admin" = "customer") {
  vi.mocked(useAuth).mockReturnValue({
    user: { uid: customerUid } as ReturnType<typeof useAuth>["user"],
    profile: { uid: customerUid, email: "cliente@example.com", role, createdAt: "" },
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  });
}

function renderOrdersPage() {
  return render(<MemoryRouter initialEntries={["/orders"]}><OrdersPage /></MemoryRouter>);
}

describe("historial y detalle de compras del cliente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuth();
  });

  it("muestra el estado y el detalle de las órdenes del cliente autenticado", async () => {
    vi.mocked(loadUserOrders).mockResolvedValue([customerOrder]);

    renderOrdersPage();

    expect(await screen.findByRole("heading", { name: "Mis compras" })).toBeInTheDocument();
    expect(await screen.findByText("En proceso")).toBeInTheDocument();
    expect(screen.getByText("Camiseta de prueba × 2")).toBeInTheDocument();
    expect(screen.getAllByText("$ 100.000")).toHaveLength(2);
    expect(loadUserOrders).toHaveBeenCalledWith(customerUid);
  });

  it("no consulta ni muestra compras cuando la sesión no tiene rol de cliente", async () => {
    setAuth("admin");
    vi.mocked(loadUserOrders).mockResolvedValue([]);

    renderOrdersPage();

    await waitFor(() => expect(loadUserOrders).not.toHaveBeenCalled());
    expect(screen.queryByRole("heading", { name: "Mis compras" })).not.toBeInTheDocument();
  });
});
