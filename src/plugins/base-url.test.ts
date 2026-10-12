import { describe, expect, it } from "vitest";
import { prefixBase } from "./base-url";

describe("prefixBase", () => {
  it("prefixes page links and adds the trailing slash", () => {
    expect(prefixBase("/games/wizard", "/rules")).toBe("/rules/games/wizard/");
    expect(prefixBase("/games/wizard/#scoring", "/rules")).toBe("/rules/games/wizard/#scoring");
    expect(prefixBase("/games/wizard?x=1", "/rules")).toBe("/rules/games/wizard/?x=1");
  });

  it("leaves file paths without a trailing slash", () => {
    expect(prefixBase("/img/all-fives-01.svg", "/rules")).toBe("/rules/img/all-fives-01.svg");
  });

  it("leaves other links alone", () => {
    expect(prefixBase("https://example.com/x", "/rules")).toBe("https://example.com/x");
    expect(prefixBase("//cdn.example.com/x", "/rules")).toBe("//cdn.example.com/x");
    expect(prefixBase("#section", "/rules")).toBe("#section");
    expect(prefixBase("/rules/games/", "/rules")).toBe("/rules/games/");
  });
});
