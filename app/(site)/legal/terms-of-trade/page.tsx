import Link from "next/link";
import { BUSINESS, contractingName } from "@/lib/business";
import { LegalPage } from "@/components/legal/legal-page";
import {
  Bullet,
  Bullets,
  Callout,
  KeyValue,
  KeyValueGrid,
  Notice,
  Section,
  Step,
  Timeline,
} from "@/components/legal/legal-blocks";
import { BusinessValue, Pending } from "@/components/legal/pending";

export const metadata = {
  title: "Terms of trade",
  robots: { index: false, follow: false },
};

const TOC = [
  { id: "intro", label: "Introduction" },
  { id: "formation", label: "1. How a job is formed" },
  { id: "price", label: "2. What the price covers" },
  { id: "variations", label: "3. Extra work" },
  { id: "windows", label: "4. Arrival windows" },
  { id: "access", label: "5. Access & site conditions" },
  { id: "stop", label: "6. Things we stop for" },
  { id: "electrical", label: "7. Electrical work" },
  { id: "payment", label: "8. Payment" },
  { id: "acl", label: "9. Your consumer rights" },
  { id: "liability", label: "10. Our liability" },
  { id: "workmanship", label: "11. Workmanship" },
  { id: "photos", label: "12. Photos of the work" },
  { id: "disputes", label: "13. If something goes wrong" },
  { id: "general", label: "14. General" },
];

export default function TermsOfTradePage() {
  return (
    <LegalPage
      title="Terms of"
      accent="trade"
      toc={TOC}
      meta={[
        { label: "Last updated", value: "July 2026" },
        { label: "Governing law", value: `${BUSINESS.jurisdiction}, Australia` },
        { label: "Applies to", value: "All installation work" },
      ]}
    >
      <Notice tag="Australian Consumer Law">
        Our services come with guarantees that cannot be excluded under the
        Australian Consumer Law. Nothing in these terms limits your statutory
        rights as a consumer.
      </Notice>

      <Section id="intro" number="Introduction" title="About these terms">
        <p>
          These terms govern the installation work we do for you. They apply when
          you accept a quote from <strong>{contractingName()}</strong> (ABN{" "}
          <BusinessValue value={BUSINESS.abn} label="ABN" />).
        </p>
        <p>
          Accepting a quote means accepting these terms, so please read them before
          you book. The version you accepted at the time is the one that governs
          your job.
        </p>
      </Section>

      <Section id="formation" number="Section 1" title="How a job is formed">
        <Timeline>
          <Step step="Step 1 — You get a price">
            You answer questions about the job and we show you a price. For most
            services that price is fixed; for a custom job we review your
            description and quote by hand.
          </Step>
          <Step step="Step 2 — You accept">
            You accept the quote, choose a two-hour arrival window, and pay any
            deposit.
          </Step>
          <Step step="Step 3 — We confirm">
            We confirm the booking. At that point there is a binding agreement
            between us on these terms.
          </Step>
        </Timeline>
      </Section>

      <Section id="price" number="Section 2" title="What the price is based on">
        <p>
          Your fixed price is calculated from the answers you give us — TV size,
          wall type, metres of lighting, whether cables need concealing. It assumes
          those answers are accurate and the site is as described.
        </p>
        <p>
          <strong>Included:</strong> labour, standard fixings and hardware, cable
          management, testing, and clean-up.
        </p>
        <p>
          <strong>Not included:</strong> supply of the appliance itself unless the
          quote says so, and any building or repair work beyond the installation.
        </p>
      </Section>

      <Section id="variations" number="Section 3" title="When extra work is needed">
        <p>
          Occasionally something on site differs from what was described — double
          brick behind plaster, no power within reach, a stud in the wrong place, or
          a mount that won&rsquo;t safely carry the appliance.
        </p>
        <Callout>
          <p>
            <strong>
              We will not carry out extra work, or charge you for it, without
              telling you the price first and getting your agreement.
            </strong>{" "}
            If you&rsquo;d rather not proceed, we stop, charge only for work already
            properly done, and you decide what happens next.
          </p>
        </Callout>
        <p>
          Any agreed extra work is itemised on your invoice, so you can see exactly
          what changed and why.
        </p>
      </Section>

      <Section id="windows" number="Section 4" title="Arrival windows">
        <p>
          We book a two-hour arrival window, not an exact time. We aim to arrive
          inside it and will contact you if we&rsquo;re running late.
        </p>
        <p>
          A window is not a guarantee. We are not liable for losses caused by a late
          arrival beyond rebooking at a time that suits you.
        </p>
      </Section>

      <Section id="access" number="Section 5" title="Access and site conditions">
        <p>You agree that on the day:</p>
        <Bullets>
          <Bullet>Someone aged 18 or over will be present for the duration of the work.</Bullet>
          <Bullet>We will have safe, clear access to the work area and to power.</Bullet>
          <Bullet>
            Fragile items, furniture and valuables will be moved clear beforehand,
            or you accept the risk of leaving them there.
          </Bullet>
          <Bullet>
            You have the right to authorise the work. If you rent, getting your
            landlord&rsquo;s permission before we drill is your responsibility.
          </Bullet>
        </Bullets>
        <p>
          If we arrive and can&rsquo;t safely start because these conditions
          aren&rsquo;t met, the visit may be treated as a late cancellation — see{" "}
          <Link href="/legal/cancellation">cancellations and refunds</Link>.
        </p>
      </Section>

      <Section id="stop" number="Section 6" title="Things we will stop for">
        <p>
          We will pause and talk to you before continuing if we encounter asbestos
          or other hazardous material, wiring that is unsafe or non-compliant,
          structural problems, or anything else making the job unsafe or unlawful to
          complete.
        </p>
        <p>
          <strong>
            You will not be charged for work we could not lawfully or safely do.
          </strong>
        </p>
      </Section>

      <Section id="electrical" number="Section 7" title="Electrical work">
        <p>
          Some services — LED strip lighting and hard-wired heaters in particular —
          involve electrical work. That work is performed by a registered electrical
          contractor (
          <BusinessValue
            value={BUSINESS.electricalLicence}
            label="electrical contractor registration"
          />
          ) and you will be issued the certificate of electrical safety required in{" "}
          {BUSINESS.jurisdiction}.
        </p>
        <p>
          Plug-in appliances and standard mounts don&rsquo;t require this, and we
          handle them end to end.
        </p>
      </Section>

      <Section id="payment" number="Section 8" title="Payment">
        <p>
          Any deposit is payable when you book. The balance is payable on completion
          — to the installer on site, or by bank transfer using the details on your
          invoice.
        </p>
        <p>
          We issue a tax invoice and receipt to your account, which you can download
          at any time from <Link href="/portal">my bookings</Link>. Title in any
          goods we supply stays with us until you have paid in full.
        </p>
      </Section>

      <Section id="acl" number="Section 9" title="Your rights under the Australian Consumer Law">
        <Callout>
          <p>
            <strong>
              Nothing in these terms excludes, restricts or modifies any guarantee,
              right or remedy you have under the Australian Consumer Law that cannot
              lawfully be excluded.
            </strong>
          </p>
        </Callout>
        <p>
          Our services come with guarantees that cannot be excluded — including that
          they will be provided with due care and skill, be fit for the purpose you
          told us about, and be supplied within a reasonable time.
        </p>
        <p>
          If we fail to meet a consumer guarantee you may be entitled to have the
          problem fixed, or to a refund or compensation, depending on how serious
          the failure is.
        </p>
      </Section>

      <Section id="liability" number="Section 10" title="Our liability">
        <p>
          Subject to section 9, our liability for any claim relating to the work is
          limited, at our option, to re-performing the work or paying the cost of
          having it re-performed. We are not liable for indirect or consequential
          loss.
        </p>
        <p>
          We are responsible for damage we cause negligently. We are not responsible
          for pre-existing defects, damage arising from inaccurate information you
          gave us, or the ordinary consequences of installation — such as fixing
          holes in a wall you asked us to mount to.
        </p>
      </Section>

      <Section id="workmanship" number="Section 11" title="Workmanship">
        <p>
          Our installation work is covered by a workmanship warranty. The terms —
          how long it lasts and what it covers — are set out in our{" "}
          <Link href="/legal/warranty">workmanship warranty</Link>.
        </p>
        <p>
          Manufacturer warranties on appliances and hardware are separate and belong
          to you.
        </p>
      </Section>

      <Section id="photos" number="Section 12" title="Photos of completed work">
        <p>
          We may photograph completed work for our own quality records. We will not
          publish a photo of your home, or identify you, without your written
          consent — and you can withdraw that consent at any time by emailing us.
        </p>
      </Section>

      <Section id="disputes" number="Section 13" title="If something goes wrong">
        <p>
          Tell us first. Email{" "}
          <BusinessValue value={BUSINESS.email} label="contact email" /> and we will
          respond in writing and try to resolve it directly. Most problems are
          fixable quickly.
        </p>
        <Callout>
          <p>
            If we can&rsquo;t resolve it, you may be able to take a domestic
            building dispute to{" "}
            <strong>
              Domestic Building Dispute Resolution {BUSINESS.jurisdiction}
            </strong>
            , or complain to <strong>Consumer Affairs {BUSINESS.jurisdiction}</strong>.
            Nothing here prevents you exercising any other right you have.
          </p>
        </Callout>
      </Section>

      <Section id="general" number="Section 14" title="General">
        <KeyValueGrid>
          <KeyValue label="Governing law" value={`${BUSINESS.jurisdiction}, Australia`} />
          <KeyValue
            label="Contact"
            value={<BusinessValue value={BUSINESS.email} label="contact email" />}
          />
        </KeyValueGrid>
        <p>
          If any part of these terms is unenforceable, the rest continues to apply.
          We may update these terms, but the version you accepted when you booked is
          the one that governs your job.
        </p>
        <p>
          <Pending>Legal review</Pending> — draft for review by an Australian legal
          practitioner. Sections 9 and 10 in particular should be checked against
          the unfair contract terms provisions of the Australian Consumer Law.
        </p>
      </Section>
    </LegalPage>
  );
}
