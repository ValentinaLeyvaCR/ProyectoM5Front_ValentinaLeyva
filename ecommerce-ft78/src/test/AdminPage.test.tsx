import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminPage } from "../pages/AdminPage";
import type { Order } from "../types/product.types";
import { testProduct } from "./fixtures";

const upload = vi.hoisted(() => vi.fn());
vi.mock("../services/s3Upload", () => ({ uploadProductImage: upload }));
vi.mock("../config/firebase", () => ({ isFirebaseConfigured: true }));

const order: Order = {
  id: "order-abcdef12", userId: "customer-1", items: [{ product: testProduct, quantity: 2 }],
  total: testProduct.price * 2, status: "pending", createdAt: "2026-10-14T14:00:00.000Z",
};
function renderAdmin(overrides: Partial<React.ComponentProps<typeof AdminPage>> = {}) {
  const props = {
    products: [testProduct], orders: [order], onProductsChange: vi.fn().mockResolvedValue(undefined),
    onOrdersChange: vi.fn().mockResolvedValue(undefined), onClose: vi.fn(), ...overrides,
  };
  return { ...render(<AdminPage {...props} />), props };
}

beforeEach(() => { vi.clearAllMocks(); upload.mockResolvedValue("https://cdn.example/product.webp"); });

describe("administración del catálogo y órdenes", () => {
  it("crea un producto subiendo la imagen a S3", async () => {
    const user = userEvent.setup();
    const { props } = renderAdmin();
    await user.type(screen.getByLabelText("Nombre"), "Mouse inalámbrico");
    await user.type(screen.getByLabelText("Descripción"), "Mouse ergonómico de prueba");
    await user.clear(screen.getByLabelText("Precio (COP)"));
    await user.type(screen.getByLabelText("Precio (COP)"), "80000");
    await user.clear(screen.getByLabelText("Stock"));
    await user.type(screen.getByLabelText("Stock"), "6");
    await user.upload(screen.getByLabelText("Imagen del producto"), new File(["bytes"], "mouse.webp", { type: "image/webp" }));
    fireEvent.submit(screen.getByRole("button", { name: "Crear producto" }).closest("form")!);
    await waitFor(() => expect(props.onProductsChange).toHaveBeenCalledTimes(1));
    const [next] = vi.mocked(props.onProductsChange).mock.calls[0];
    expect(next[0]).toMatchObject({ name: "Mouse inalámbrico", price: 80000, stock: 6, imageUrl: "https://cdn.example/product.webp" });
    expect(upload).toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent("Producto agregado.");
  });

  it("muestra el error cuando falla la carga de una imagen", async () => {
    upload.mockRejectedValue(new Error("fallo de S3"));
    const user = userEvent.setup();
    const { props } = renderAdmin();
    await user.type(screen.getByLabelText("Nombre"), "Teclado");
    await user.type(screen.getByLabelText("Descripción"), "Mecánico");
    await user.type(screen.getByLabelText("Precio (COP)"), "120000");
    await user.type(screen.getByLabelText("Stock"), "2");
    await user.upload(screen.getByLabelText("Imagen del producto"), new File(["bytes"], "keyboard.png", { type: "image/png" }));
    fireEvent.submit(screen.getByRole("button", { name: "Crear producto" }).closest("form")!);
    expect(await screen.findByRole("status")).toHaveTextContent("No se pudo guardar el producto o subir la imagen");
    expect(props.onProductsChange).not.toHaveBeenCalled();
  });

  it("edita y cancela la edición conservando la imagen existente", async () => {
    const user = userEvent.setup();
    const { props } = renderAdmin();
    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByRole("heading", { name: "Actualizar producto" })).toBeInTheDocument();
    expect(screen.getByLabelText("Imagen del producto")).not.toBeRequired();
    await user.clear(screen.getByLabelText("Nombre"));
    await user.type(screen.getByLabelText("Nombre"), "Camiseta editada");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(props.onProductsChange).toHaveBeenCalled());
    expect(vi.mocked(props.onProductsChange).mock.calls[0][0][0]).toMatchObject({ id: testProduct.id, name: "Camiseta editada", imageUrl: testProduct.imageUrl });
    expect(await screen.findByRole("status")).toHaveTextContent("Producto actualizado.");

    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "Agregar producto" })).toBeInTheDocument();
  });

  it("confirma la eliminación y muestra fallos de guardado", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    const user = userEvent.setup();
    const { props } = renderAdmin({ onProductsChange: vi.fn().mockRejectedValue(new Error("Firestore")) });
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(props.onProductsChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(await screen.findByRole("status")).toHaveTextContent("No se pudo eliminar el producto");
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it("filtra órdenes, actualiza su estado y permite volver a la tienda", async () => {
    const user = userEvent.setup();
    const { props } = renderAdmin({ error: "Aviso de conexión" });
    expect(screen.getByRole("alert")).toHaveTextContent("Aviso de conexión");
    await user.click(screen.getByRole("button", { name: /Órdenes/ }));
    expect(screen.getByText("#order-ab")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Estado de la orden order-ab"), "processing");
    await waitFor(() => expect(props.onOrdersChange).toHaveBeenCalledWith([{ ...order, status: "processing" }]));
    await user.selectOptions(screen.getByLabelText("Estado"), "completed");
    expect(screen.getByText("No hay órdenes para mostrar.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Volver a la tienda ↗" }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("muestra el error al fallar el cambio de estado", async () => {
    const user = userEvent.setup();
    const onOrdersChange = vi.fn().mockRejectedValue(new Error("Firestore"));
    renderAdmin({ onOrdersChange });
    await user.click(screen.getByRole("button", { name: /Órdenes/ }));
    fireEvent.change(screen.getByLabelText("Estado de la orden order-ab"), { target: { value: "completed" } });
    await waitFor(() => expect(onOrdersChange).toHaveBeenCalled());
    expect(await screen.findByRole("status")).toHaveTextContent("No se pudo actualizar el estado de la orden.");
  });
});


