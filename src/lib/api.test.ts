
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "./api";

describe("getCurrentUser", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the user profile when the API succeeds", async () => {
    const profile = {
      id: "test-user-1",
      name: "Test User",
      email: "test@example.com",
      image: null,
      favoriteMovie: "RRR",
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => profile,
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(getCurrentUser()).resolves.toEqual(profile);

    expect(fetchMock).toHaveBeenCalledWith("/api/me", {
      cache: "no-store",
    });
  });

  it("throws an error when the user is not authenticated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Please sign in first." }),
      })
    );

    await expect(getCurrentUser()).rejects.toThrow(
      "Please sign in first."
    );
  });

  it("rejects an invalid API response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ favoriteMovie: "RRR" }),
      })
    );

    await expect(getCurrentUser()).rejects.toThrow(
      "Invalid user profile response."
    );
  });
});
