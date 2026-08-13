import { describe, expect, it } from "vitest";
import { TEMPLATE_LABELS, labelForTemplate } from "@/lib/email/labels";
import { TEMPLATES, type EmailTemplate } from "@/lib/email/templates";

describe("template labels", () => {
  it("covers every template", () => {
    // The Record type already enforces this at compile time; this catches the
    // case where a label exists but is blank.
    for (const template of Object.keys(TEMPLATES) as EmailTemplate[]) {
      expect(TEMPLATE_LABELS[template]?.trim()).toBeTruthy();
    }
  });

  it("reads from the sender's point of view", () => {
    expect(labelForTemplate("quote_ready")).toBe("Quote sent");
    expect(labelForTemplate("payment_due")).toBe("Invoice sent");
  });

  it("marks admin alerts as alerts", () => {
    for (const template of Object.keys(TEMPLATES) as EmailTemplate[]) {
      if (TEMPLATES[template].audience !== "admin") continue;
      expect(labelForTemplate(template)).toMatch(/^Alert:/);
    }
  });

  it("stays readable for a template the map has never heard of", () => {
    // email_log.template is a text column on purpose, so retired or renamed
    // templates still have history — and that history still has to render.
    expect(labelForTemplate("deposit_refunded")).toBe("Deposit refunded");
    expect(labelForTemplate("admin_weekly_digest")).toBe("Alert: weekly digest");
  });

  it("never returns an empty label", () => {
    expect(labelForTemplate("x")).toBe("X");
    expect(labelForTemplate("")).toBe("");
  });
});
