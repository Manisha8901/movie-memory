
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import DashboardClient from "./DashboardClient";
import * as api from "../../src/lib/api";

vi.mock("../../src/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/api")>();
  return {
    ...actual,
    updateFavoriteMovie: vi.fn(),
  };
});

vi.mock("./FactCard", () => ({
  default: () => <div>Movie Fact Component</div>,
}));

describe("DashboardClient optimistic editing", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("saves a new movie successfully", async () => {
    vi.mocked(api.updateFavoriteMovie).mockResolvedValue({
      movie: "Interstellar",
    });

    render(<DashboardClient initialMovie="RRR" />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Interstellar" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Interstellar")).toBeTruthy();

    await waitFor(() => {
      expect(api.updateFavoriteMovie).toHaveBeenCalledWith("Interstellar");
    });
  });

  it("restores the original movie when saving fails", async () => {
    vi.mocked(api.updateFavoriteMovie).mockRejectedValue(
      new Error("Server unavailable")
    );

    render(<DashboardClient initialMovie="RRR" />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Interstellar" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Interstellar")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("RRR")).toBeTruthy();
    });

    expect(api.updateFavoriteMovie).toHaveBeenCalledWith("Interstellar");
  });
});
