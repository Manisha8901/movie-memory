
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import FactCard from "./FactCard";
import { getMovieFact } from "../../src/lib/api";

vi.mock("../../src/lib/api", () => ({
  getMovieFact: vi.fn(),
}));

const firstFact = {
  movie: "RRR",
  fact: "RRR won the Academy Award for Best Original Song.",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const secondFact = {
  movie: "RRR",
  fact: "RRR was directed by S. S. Rajamouli.",
  createdAt: "2026-01-01T00:01:00.000Z",
};

describe("FactCard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("automatically loads a fact when the card appears", async () => {
    vi.mocked(getMovieFact).mockResolvedValue(firstFact);

    render(<FactCard movie="RRR" />);

    expect(
      await screen.findByText(firstFact.fact)
    ).toBeTruthy();

    expect(getMovieFact).toHaveBeenCalledTimes(1);
  });

  it("shows a loading state while generating a fact", async () => {
    let resolveRequest!: (
      value: Awaited<ReturnType<typeof getMovieFact>>
    ) => void;

    vi.mocked(getMovieFact).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
    );

    render(<FactCard movie="RRR" />);

    expect(
      screen.getByText("Finding an interesting movie fact...")
    ).toBeTruthy();

    const button = screen.getByRole("button", {
      name: "Generating...",
    });

    expect(button.hasAttribute("disabled")).toBe(true);
    expect(getMovieFact).toHaveBeenCalledTimes(1);

    resolveRequest(firstFact);

    expect(
      await screen.findByText(firstFact.fact)
    ).toBeTruthy();
  });

  it("generates a fresh fact when the button is clicked", async () => {
    vi.mocked(getMovieFact)
      .mockResolvedValueOnce(firstFact)
      .mockResolvedValueOnce(secondFact);

    render(<FactCard movie="RRR" />);

    expect(
      await screen.findByText(firstFact.fact)
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Generate New Fact",
      })
    );

    expect(
      await screen.findByText(secondFact.fact)
    ).toBeTruthy();

    expect(getMovieFact).toHaveBeenCalledTimes(2);
  });

  it("does not request another fact on a normal rerender", async () => {
    vi.mocked(getMovieFact).mockResolvedValue(firstFact);

    const { rerender } = render(
      <FactCard movie="RRR" />
    );

    expect(
      await screen.findByText(firstFact.fact)
    ).toBeTruthy();

    rerender(<FactCard movie="RRR" />);

    expect(
      screen.getByText(firstFact.fact)
    ).toBeTruthy();

    expect(getMovieFact).toHaveBeenCalledTimes(1);
  });

  it("clears the old fact when the favorite movie changes", async () => {
    const interstellarFact = {
      movie: "Interstellar",
      fact: "Interstellar was directed by Christopher Nolan.",
      createdAt: "2026-01-01T00:02:00.000Z",
    };

    vi.mocked(getMovieFact)
      .mockResolvedValueOnce(firstFact)
      .mockResolvedValueOnce(interstellarFact);

    const { rerender } = render(
      <FactCard key="RRR" movie="RRR" />
    );

    expect(
      await screen.findByText(firstFact.fact)
    ).toBeTruthy();

    rerender(
      <FactCard
        key="Interstellar"
        movie="Interstellar"
      />
    );

    expect(
      screen.queryByText(firstFact.fact)
    ).toBeNull();

    expect(
      await screen.findByText(interstellarFact.fact)
    ).toBeTruthy();

    expect(getMovieFact).toHaveBeenCalledTimes(2);
  });

  it("keeps the previous fact when a refresh fails", async () => {
    vi.mocked(getMovieFact)
      .mockResolvedValueOnce(firstFact)
      .mockRejectedValueOnce(
        new Error("API rate limit reached.")
      );

    render(<FactCard movie="RRR" />);

    expect(
      await screen.findByText(firstFact.fact)
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Generate New Fact",
      })
    );

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(
        "API rate limit reached."
      );
    });

    expect(
      screen.getByText(firstFact.fact)
    ).toBeTruthy();

    expect(
      screen.getByRole("alert").textContent
    ).toContain("Showing your previous fact.");

    expect(getMovieFact).toHaveBeenCalledTimes(2);
  });

  it("shows an error when the first request fails", async () => {
    vi.mocked(getMovieFact).mockRejectedValue(
      new Error("Movie facts are temporarily unavailable.")
    );

    render(<FactCard movie="RRR" />);

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(
        "Movie facts are temporarily unavailable."
      );
    });

    expect(
      screen.getByRole("button", {
        name: "Generate New Fact",
      }).hasAttribute("disabled")
    ).toBe(false);
  });

it("reuses the shared cache when the card remounts", async () => {
  const sharedCache = {
    current: null as import("../../src/lib/factCache").CachedFact | null,
  };

  vi.mocked(getMovieFact).mockResolvedValue(firstFact);

  const { unmount } = render(
    <FactCard movie="RRR" sharedCache={sharedCache} />
  );

  expect(
    await screen.findByText(firstFact.fact)
  ).toBeTruthy();

  expect(getMovieFact).toHaveBeenCalledTimes(1);

  unmount();

  render(<FactCard movie="RRR" sharedCache={sharedCache} />);

  expect(
    await screen.findByText(firstFact.fact)
  ).toBeTruthy();

  // The second mount must not call the API again.
  expect(getMovieFact).toHaveBeenCalledTimes(1);
});

});
