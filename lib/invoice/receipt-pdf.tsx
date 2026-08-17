import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { LineItem } from "@/lib/invoice/calc";
import { BUSINESS, contractingName } from "@/lib/business";

export type ReceiptData = {
  invoiceNumber: string;
  status: string;
  paidAt: string | null;
  issuedAt: string;
  serviceName: string;
  customerName: string;
  address: string | null;
  lineItems: LineItem[];
  subtotalCents: number;
  gstCents: number;
  totalCents: number;
  /** Deposit already paid, credited against this bill. Zero when none. */
  depositCreditCents: number;
  /** Still outstanding. Zero on a settled invoice. */
  balanceCents: number;
  /** Plain date, already formatted for display. Null means due on receipt. */
  dueDate: string | null;
};

/**
 * Identity block for the invoice, from the single source of truth.
 *
 * This file used to hardcode `ABN 00 000 000 000` alongside a "GST (10%)"
 * line. A document that charges GST without a valid ABN is not a valid tax
 * invoice — the customer can't claim the credit, and a business paying it can
 * be obliged to withhold under the no-ABN withholding rules. Nulls are now
 * omitted rather than faked.
 */
const ISSUER = {
  name: contractingName(),
  abn: BUSINESS.abn ? `ABN ${BUSINESS.abn}` : null,
  email: BUSINESS.email,
  region: `Servicing ${BUSINESS.serviceArea}`,
};

const aud = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: "#1c1917", fontFamily: "Helvetica" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  muted: { color: "#78716c" },
  h: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  paidBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    color: "#166534",
    backgroundColor: "#dcfce7",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontFamily: "Helvetica-Bold",
  },
  table: { marginTop: 8, borderTopWidth: 1, borderTopColor: "#e7e5e4" },
  th: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e7e5e4",
    paddingVertical: 6,
    color: "#78716c",
    fontFamily: "Helvetica-Bold",
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f4",
    paddingVertical: 6,
  },
  cDesc: { flex: 1 },
  cQty: { width: 50, textAlign: "right" },
  cUnit: { width: 80, textAlign: "right" },
  cAmt: { width: 80, textAlign: "right" },
  totals: { marginTop: 12, alignSelf: "flex-end", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#e7e5e4",
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  footer: { marginTop: 40, color: "#a8a29e", fontSize: 8 },
  // Drawn first so the invoice content prints over it, and `fixed` so it
  // repeats on a bill long enough to run to a second page.
  watermark: {
    position: "absolute",
    // react-pdf rotates about the block's top-left corner and ignores
    // `transformOrigin`, so a -30° turn throws the word down and to the left.
    // These offsets are the compensation, not a design choice — they put the
    // stamp across the middle of the page. Re-check the render if the angle,
    // the font size or the word ever changes.
    top: "26%",
    left: "8%",
    right: 0,
    textAlign: "center",
    fontSize: 90,
    letterSpacing: 10,
    fontFamily: "Helvetica-Bold",
    color: "#dc2626",
    opacity: 0.11,
    transform: "rotate(-30deg)",
  },
});

/** Branded A4 receipt/invoice document. */
export function ReceiptDocument({ data }: { data: ReceiptData }) {
  const paid = data.status === "paid";
  return (
    <Document title={data.invoiceNumber}>
      <Page size="A4" style={s.page}>
        {/*
          An unpaid bill must not be mistakable for a receipt. The same document
          serves both — the only difference used to be a heading and a footer
          line, which is easy to miss on a printout or a phone screenshot, and
          the customer keeps whichever copy they saved. Anything not settled is
          stamped, `draft` included.
        */}
        {!paid && (
          <Text style={s.watermark} fixed>
            UNPAID
          </Text>
        )}

        <View style={s.row}>
          <View>
            <Text style={s.brand}>{ISSUER.name}</Text>
            {ISSUER.abn && <Text style={s.muted}>{ISSUER.abn}</Text>}
            <Text style={s.muted}>{ISSUER.region}</Text>
            {ISSUER.email && <Text style={s.muted}>{ISSUER.email}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.h}>{paid ? "Receipt" : "Tax Invoice"}</Text>
            <Text>{data.invoiceNumber}</Text>
            <Text style={s.muted}>Issued {data.issuedAt}</Text>
            {paid && <Text style={s.paidBadge}>PAID{data.paidAt ? ` · ${data.paidAt}` : ""}</Text>}
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={s.muted}>Billed to</Text>
          <Text>{data.customerName}</Text>
          {data.address && <Text style={s.muted}>{data.address}</Text>}
          <Text style={{ marginTop: 6 }}>{data.serviceName}</Text>
        </View>

        <View style={s.table}>
          <View style={s.th}>
            <Text style={s.cDesc}>Description</Text>
            <Text style={s.cQty}>Qty</Text>
            <Text style={s.cUnit}>Unit</Text>
            <Text style={s.cAmt}>Amount</Text>
          </View>
          {data.lineItems.map((item, i) => (
            <View style={s.tr} key={i}>
              <Text style={s.cDesc}>{item.description}</Text>
              <Text style={s.cQty}>{item.quantity}</Text>
              <Text style={s.cUnit}>{aud(item.unit_price_cents)}</Text>
              <Text style={s.cAmt}>{aud(item.total_cents)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.muted}>Subtotal (ex GST)</Text>
            <Text>{aud(data.subtotalCents)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.muted}>GST (10%)</Text>
            <Text>{aud(data.gstCents)}</Text>
          </View>
          <View style={s.grand}>
            <Text>Total</Text>
            <Text>{aud(data.totalCents)}</Text>
          </View>

          {/*
            The deposit sits *below* the GST-inclusive total, not among the line
            items: it's a payment against the bill, not a discount on it. Moving
            it above would understate the taxable supply and the GST charged on
            it, which is the one number on this page the ATO cares about.
          */}
          {data.depositCreditCents > 0 && (
            <View style={s.totalRow}>
              <Text style={s.muted}>Less deposit paid</Text>
              {/*
                ASCII hyphen, not the typographic minus (U+2212): the built-in
                Helvetica has no glyph for it, so react-pdf dropped the
                character silently and the credit printed as a positive
                "$148.00" — a deduction that looked like another charge.
              */}
              <Text>-{aud(data.depositCreditCents)}</Text>
            </View>
          )}
          {!paid && (
            <View style={s.grand}>
              <Text>Balance due</Text>
              <Text>{aud(data.balanceCents)}</Text>
            </View>
          )}
        </View>

        <Text style={s.footer}>
          {paid
            ? "Thank you — payment received in full."
            : `Payment due ${data.dueDate ? `by ${data.dueDate}` : "on completion"}. Pay the installer on site or by bank transfer.`}{" "}
          Generated by {ISSUER.name}.
        </Text>
      </Page>
    </Document>
  );
}
