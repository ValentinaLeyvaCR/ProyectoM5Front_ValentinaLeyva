import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../contexts/AppProviders";

export function renderWithProviders(ui: ReactElement, route = "/") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppProviders>{ui}</AppProviders>
    </MemoryRouter>,
  );
}
