import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthPage } from "../pages/AuthPage";
import { ProductList } from "../components/common/ProductList";
import { CartList } from "../components/common/CartList";
import { EmptyState } from "../components/ui/EmptyState";
import { testProduct } from "./fixtures";

const auth = vi.hoisted(() => ({ login: vi.fn(), register: vi.fn(), loginWithGoogle: vi.fn(), logout: vi.fn() }));
vi.mock("../contexts/auth/useAuth", () => ({ useAuth: () => auth }));

function renderAuth(mode: "login" | "register" = "login") {
  return render(<MemoryRouter><AuthPage mode={mode} /></MemoryRouter>);
}

describe("pantalla de autenticación", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("permite iniciar sesión y muestra el estado de procesamiento", async () => {
    let resolve!: () => void;
    auth.login.mockImplementation(() => new Promise<void>((done) => { resolve = done; }));
    const user = userEvent.setup();
    renderAuth();
    await user.type(screen.getByLabelText("Correo electrónico"), "cliente@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "secreto123");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(await screen.findByRole("button", { name: "Procesando…" })).toBeDisabled();
    resolve();
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    expect(auth.login).toHaveBeenCalledWith("cliente@example.com", "secreto123");
  });

  it("muestra errores de inicio de sesión", async () => {
    auth.login.mockRejectedValue(new Error("Credenciales incorrectas"));
    const user = userEvent.setup();
    renderAuth();
    await user.type(screen.getByLabelText("Correo electrónico"), "cliente@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "secreto123");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales incorrectas");
  });

  it("registra una cuenta y presenta el mensaje alternativo para errores no estándar", async () => {
    auth.register.mockRejectedValue("fallo");
    const user = userEvent.setup();
    renderAuth("register");
    expect(screen.getByRole("heading", { name: "Crear cuenta" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Correo electrónico"), "nuevo@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "secreto123");
    await user.click(screen.getByRole("button", { name: "Registrarme" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo completar la solicitud.");
    expect(auth.register).toHaveBeenCalledWith("nuevo@example.com", "secreto123");
    expect(screen.getByRole("link", { name: "Inicia sesión" })).toHaveAttribute("href", "/login");
  });

  it("inicia con Google y muestra errores del proveedor", async () => {
    auth.loginWithGoogle.mockRejectedValue(new Error("Google rechazó el acceso"));
    const user = userEvent.setup();
    renderAuth();
    await user.click(screen.getByRole("button", { name: "Continuar con Google" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Google rechazó el acceso");
    auth.loginWithGoogle.mockResolvedValue(undefined);
    await user.click(screen.getByRole("button", { name: "Continuar con Google" }));
    expect(auth.loginWithGoogle).toHaveBeenCalledTimes(2);
  });
});

describe("componentes de catálogo y carrito", () => {
  it("muestra productos, bloquea los agotados y delega selección y adición", async () => {
    const onAdd = vi.fn();
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const soldOut = { ...testProduct, id: "sold-out", name: "Agotado", stock: 0 };
    render(<ProductList products={[testProduct, soldOut]} onAdd={onAdd} onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: `Ver ${testProduct.name}` }));
    await user.click(screen.getAllByRole("button", { name: "Agregar al carrito" })[0]);
    expect(onSelect).toHaveBeenCalledWith(testProduct);
    expect(onAdd).toHaveBeenCalledWith(testProduct);
    expect(screen.getAllByRole("button", { name: "Agregar al carrito" })[1]).toBeDisabled();
  });

  it("permite ajustar o retirar un producto del carrito", async () => {
    const dispatch = vi.fn();
    const user = userEvent.setup();
    render(<CartList items={[{ product: testProduct, quantity: 2 }]} dispatch={dispatch} />);
    await user.click(screen.getByRole("button", { name: `Disminuir ${testProduct.name}` }));
    await user.click(screen.getByRole("button", { name: `Aumentar ${testProduct.name}` }));
    await user.click(screen.getByRole("button", { name: `Eliminar ${testProduct.name}` }));
    expect(dispatch).toHaveBeenNthCalledWith(1, { type: "setQuantity", productId: testProduct.id, quantity: 1 });
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: "setQuantity", productId: testProduct.id, quantity: 3 });
    expect(dispatch).toHaveBeenNthCalledWith(3, { type: "remove", productId: testProduct.id });
  });

  it("renderiza un estado vacío accesible", () => {
    render(<EmptyState message="No hay artículos" />);
    expect(screen.getByRole("status")).toHaveTextContent("No hay artículos");
  });
});


