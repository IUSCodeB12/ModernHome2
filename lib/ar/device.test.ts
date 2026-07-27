import { describe, expect, it } from "vitest";
import { isAppleMobile } from "@/lib/ar/device";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPAD_LEGACY =
  "Mozilla/5.0 (iPad; CPU OS 12_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1";
// iPadOS 13+ masquerades as a desktop Mac — UA alone can't tell them apart.
const IPAD_DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const MAC_SAFARI = IPAD_DESKTOP_UA;
const WINDOWS_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";

describe("isAppleMobile", () => {
  it("detects iPhone and older iPads from the user agent", () => {
    expect(isAppleMobile(IPHONE, "iPhone", 5)).toBe(true);
    expect(isAppleMobile(IPAD_LEGACY, "iPad", 5)).toBe(true);
  });

  it("detects iPadOS 13+ pretending to be a Mac", () => {
    expect(isAppleMobile(IPAD_DESKTOP_UA, "MacIntel", 5)).toBe(true);
  });

  it("does not mistake a real Mac for an iPad", () => {
    // Same UA as the iPad above — only maxTouchPoints separates them.
    expect(isAppleMobile(MAC_SAFARI, "MacIntel", 0)).toBe(false);
  });

  it("rejects non-Apple platforms", () => {
    expect(isAppleMobile(WINDOWS_CHROME, "Win32", 0)).toBe(false);
    expect(isAppleMobile(ANDROID_CHROME, "Linux armv8l", 5)).toBe(false);
  });
});
