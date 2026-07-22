import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/auth/redirect";

describe("safeNext (open-redirect guard)", () => {
  it("allows same-origin rooted paths", () => {
    expect(safeNext("/portal")).toBe("/portal");
    expect(safeNext("/portal/abc?x=1#y")).toBe("/portal/abc?x=1#y");
    expect(safeNext("/admin/bookings")).toBe("/admin/bookings");
  });

  it("falls back for empty / nullish input", () => {
    expect(safeNext(null)).toBe("/portal");
    expect(safeNext(undefined)).toBe("/portal");
    expect(safeNext("")).toBe("/portal");
    expect(safeNext(null, "/home")).toBe("/home");
  });

  it("rejects absolute and scheme URLs", () => {
    expect(safeNext("https://evil.com")).toBe("/portal");
    expect(safeNext("http://evil.com")).toBe("/portal");
    expect(safeNext("javascript:alert(1)")).toBe("/portal");
    expect(safeNext("mailto:x@y.z")).toBe("/portal");
  });

  it("rejects protocol-relative and backslash tricks", () => {
    expect(safeNext("//evil.com")).toBe("/portal");
    expect(safeNext("/\\evil.com")).toBe("/portal");
    expect(safeNext("/\t/evil.com")).toBe("/portal");
  });

  it("rejects whitespace / control-char smuggling", () => {
    expect(safeNext("/foo\nbar")).toBe("/portal");
    expect(safeNext("/foo\tbar")).toBe("/portal");
    expect(safeNext("/ /evil.com")).toBe("/portal");
  });

  it("rejects paths that don't start with a slash", () => {
    expect(safeNext("portal")).toBe("/portal");
    expect(safeNext("evil.com")).toBe("/portal");
  });
});
