export type LineItem = {
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
};

export type InvoiceTotals = {
  subtotal_cents: number;
  gst_cents: number;
  total_cents: number;
};

/** Australian GST rate (10%), applied as a component of a GST-inclusive total. */
export const GST_RATE = 0.1;

export function lineItemTotal(quantity: number, unitPriceCents: number): number {
  return Math.round(quantity * unitPriceCents);
}

/**
 * Totals for a set of line items. Prices are treated as GST-inclusive
 * (standard for AU consumer quotes): subtotal is the ex-GST portion and
 * gst is the 1/11th component, so subtotal + gst = sum of line totals.
 */
export function calcInvoiceTotals(items: LineItem[]): InvoiceTotals {
  const total = items.reduce(
    (sum, item) => sum + lineItemTotal(item.quantity, item.unit_price_cents),
    0
  );
  const gst = Math.round(total - total / (1 + GST_RATE));
  return {
    subtotal_cents: total - gst,
    gst_cents: gst,
    total_cents: total,
  };
}

export function normalizeLineItems(
  items: Array<{ description: string; quantity: number; unit_price_cents: number }>
): LineItem[] {
  return items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price_cents: item.unit_price_cents,
    total_cents: lineItemTotal(item.quantity, item.unit_price_cents),
  }));
}
