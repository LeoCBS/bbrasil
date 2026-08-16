import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("px-2", "text-sm")).toBe("px-2 text-sm");
  });

  it("ignores falsy values and flattens arrays and objects", () => {
    expect(cn("px-2", undefined, null, false, ["text-sm", { hidden: false, block: true }])).toBe("px-2 text-sm block");
  });

  it("keeps the last conflicting tailwind class", () => {
    expect(cn("px-2 px-4", "text-sm text-lg")).toBe("px-4 text-lg");
  });

  it("returns an empty string when there is nothing to merge", () => {
    expect(cn()).toBe("");
  });
});
