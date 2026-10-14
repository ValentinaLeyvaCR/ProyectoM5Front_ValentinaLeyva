import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "../pages/HomePage";
import { CartProvider } from "../contexts/cart/CartProvider";
import { ThemeProvider } from "../contexts/theme/ThemeProvider";
import { useAuth } from "../contexts/auth/useAuth";
import { loadProducts, saveOrder } from "../services/firestoreStore";
import { testProduct } from "./fixtures";
import type { UserProfile } from "../types/auth.types";

vi.mock("../contexts/auth/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../services/firestoreStore", () => ({ loadProducts: vi.fn(), saveOrder: vi.fn() }));
vi.mock("../config/firebase", () => ({ isFirebaseConfigured: true }));

const keyboard = { ...testProduct, id: "keyboard-1", name: "Teclado mecánico", category: "Teclados", stock: 2 };
function CurrentPath() { return <div data-testid="path">{useLocation().pathname}</div>; }
function renderHome() {
  return render(<MemoryRouter initialEntries={["/"]}><ThemeProvider><CartProvider><CurrentPath /><HomePage /></CartProvider></ThemeProvider></MemoryRouter>);
}
function setCustomer(user: ReturnType<typeof useAuth>["user"] = null, role: "customer" | "admin" = "customer") {
  vi.mocked(useAuth).mockReturnValue({ user, profile: user ? { uid: user.uid, email: "a@b.co", role, createdAt: "" } as UserProfile : null, loading: false, login: vi.fn(), register: vi.fn(), loginWithGoogle: vi.fn(), logout: vi.fn() });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("MODE", "test");
  setCustomer();
  vi.mocked(loadProducts).mockResolvedValue([testProduct, keyboard]);
  vi.mocked(saveOrder).mockResolvedValue(undefined);
});

describe("catálogo y flujo de compra", () => {
  it("carga, busca y filtra productos por categoría", async () => {
    const user = userEvent.setup();
    renderHome();
    expect(await screen.findByRole("heading", { name: "Nuestros productos" })).toBeInTheDocument();
    expect(screen.getByText("Camiseta de prueba")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Filtrar por categoría"), "Teclados");
    expect(screen.getByText("Teclado mecánico")).toBeInTheDocument();
    expect(screen.queryByText("Camiseta de prueba")).not.toBeInTheDocument();
    await user.clear(screen.getByRole("textbox", { name: "Buscar productos" }));
    await user.type(screen.getByRole("textbox", { name: "Buscar productos" }), "  mecÁnico  ");
    expect(await screen.findByText("Teclado mecánico")).toBeInTheDocument();
    expect(screen.queryByText("Camiseta de prueba")).not.toBeInTheDocument();
  });

  it("muestra el estado de carga, catálogo vacío y errores al consultar productos", async () => {
    let resolve!: (products: typeof testProduct[]) => void;
    vi.mocked(loadProducts).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    renderHome();
    expect(screen.getByRole("status")).toHaveTextContent("Cargando productos");
    await act(async () => resolve([]));
    expect(await screen.findByRole("status")).toHaveTextContent("No encontramos productos");

    vi.mocked(loadProducts).mockRejectedValueOnce(new Error("offline"));
    renderHome();
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar el catálogo");
  });

  it("abre y cierra detalles y el carrito; agregar desde el detalle actualiza el carrito", async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(await screen.findByRole("button", { name: `Ver ${testProduct.name}` }));
    expect(screen.getByRole("dialog", { name: `Detalle de ${testProduct.name}` })).toBeInTheDocument();
    await user.click(within(screen.getByRole("dialog", { name: `Detalle de ${testProduct.name}` })).getByRole("button", { name: "Agregar al carrito" }));
    expect(await screen.findByRole("status")).toHaveTextContent("se agregó al carrito");
    await user.click(screen.getByRole("button", { name: /Carrito \(1\)/ }));
    expect(screen.getByRole("dialog", { name: "Carrito de compras" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar carrito" }));
    expect(screen.queryByRole("dialog", { name: "Carrito de compras" })).not.toBeInTheDocument();
  });

  it("permite una compra demo autenticada y limpia el carrito", async () => {
    const user = userEvent.setup();
    setCustomer({ uid: "customer-7" } as ReturnType<typeof useAuth>["user"]);
    renderHome();
    await user.click((await screen.findAllByRole("button", { name: "Agregar al carrito" }))[0]);
    await user.click(screen.getByRole("button", { name: /Carrito \(1\)/ }));
    await user.click(screen.getByRole("button", { name: "Confirmar compra de prueba" }));
    await waitFor(() => expect(saveOrder).toHaveBeenCalledWith(expect.objectContaining({ userId: "customer-7", status: "pending" })));
    expect(await screen.findByTestId("path")).toHaveTextContent("/orders");
  });

  it("solicita iniciar sesión antes de comprar en producción", async () => {
    const user = userEvent.setup();
    vi.stubEnv("MODE", "production");
    renderHome();
    await user.click((await screen.findAllByRole("button", { name: "Agregar al carrito" }))[0]);
    await user.click(screen.getByRole("button", { name: /Carrito \(1\)/ }));
    await user.click(screen.getByRole("button", { name: "Confirmar compra de prueba" }));
    expect(await screen.findByTestId("path")).toHaveTextContent("/login");
    expect(saveOrder).not.toHaveBeenCalled();
  });

  it("muestra un error cuando Firestore no guarda la orden", async () => {
    const user = userEvent.setup();
    vi.mocked(saveOrder).mockRejectedValueOnce(new Error("Firestore"));
    renderHome();
    await user.click((await screen.findAllByRole("button", { name: "Agregar al carrito" }))[0]);
    await user.click(screen.getByRole("button", { name: /Carrito \(1\)/ }));
    await user.click(screen.getByRole("button", { name: "Confirmar compra de prueba" }));
    expect(await screen.findByRole("status")).toHaveTextContent("No se pudo guardar la orden");
  });
});



