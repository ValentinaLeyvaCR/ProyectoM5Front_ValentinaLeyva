import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "../routes/AppRoutes";
import { renderWithProviders } from "./renderWithProviders";

describe("flujo de compra demo", () => {
  it("agrega un producto al carrito y confirma la compra simulada", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />);

    await user.click((await screen.findAllByRole("button", { name: "Agregar al carrito" }))[0]);
    await user.click(screen.getByRole("button", { name: /Carrito \(1\)/ }));
    await user.click(screen.getByRole("button", { name: "Confirmar compra de prueba" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Compra de prueba confirmada");
  });
});
