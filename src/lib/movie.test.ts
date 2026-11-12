
import { describe, expect, it } from "vitest";
import { validateMovieTitle } from "./movieValidation";

describe("validateMovieTitle", () => {
  it("accepts a valid movie title", () => {
    expect(validateMovieTitle("RRR")).toBeNull();
  });

  it("rejects an empty title", () => {
    expect(validateMovieTitle("   ")).not.toBeNull();
  });

  it("rejects a one-character title", () => {
    expect(validateMovieTitle("A")).not.toBeNull();
  });

  it("accepts a title with exactly 2 characters", () => {
    expect(validateMovieTitle("Up")).toBeNull();
  });

  it("accepts a title with exactly 100 characters", () => {
    expect(validateMovieTitle("A".repeat(100))).toBeNull();
  });

  it("rejects a title longer than 100 characters", () => {
    expect(validateMovieTitle("A".repeat(101))).not.toBeNull();
  });

  it("trims surrounding whitespace before validation", () => {
    expect(validateMovieTitle("  RRR  ")).toBeNull();
  });
});
