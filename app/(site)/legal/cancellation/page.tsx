import Link from "next/link";
import { BUSINESS } from "@/lib/business";
import { LegalPage } from "@/components/legal/legal-page";
import {
  Callout,
  KeyValue,
  KeyValueGrid,
  Notice,
  Scenario,
  ScenarioList,
  Section,
  Step,
  Timeline,
} from "@/components/legal/legal-blocks";
import { BusinessValue, Pending } from "@/components/legal/pending";

export const metadata = {
  title: "Cancellations & refunds",
  robots: { index: false, follow: false },
};

const TOC = [
  { id: "intro", label: "Introduction" },
  { id: "entitled", label: "1. When you get a refund" },
  { id: "not-available", label: "2. When you don't" },
  { id: "deposits", label: "3. Deposits" },
  { id: "how-to", label: "4. How to cancel" },
  { id: "processing", label: "5. Processing times" },
  { id: "consumer", label: "6. Your consumer rights" },
  { id: "contact", label: "7. Contact" },
];

export default function CancellationPage() {
  return (
    <LegalPage
      title="Cancellations &"
      accent="refunds"
      toc={TOC}
      meta={[
        { label: "Last updated", value: "July 2026" },
        { label: "Legislation", value: "Australian Consumer Law" },
        { label: "Currency", value: "Australian dollars (AUD)" },
      ]}
    >
      <Notice tag="Important — your consumer law rights">
        Our services come with guarantees that cannot be excluded under the
        Australian Consumer Law. Nothing in this policy limits, excludes or
        modifies any right or remedy you have under the ACL. This policy sets out
        our practices in addition to — not instead of — your statutory rights.
      </Notice>

      <Section id="intro" number="Introduction" title="About this policy">
        <p>
          Plans change. This explains what happens if you need to move or cancel a
          booking, and when a deposit comes back to you.
        </p>
        <p>
          This policy is about <strong>cancelling a booking</strong>. If the work
          has already been done and there&rsquo;s a problem with it, that&rsquo;s
          handled under your{" "}
          <Link href="/legal/warranty">workmanship warranty</Link> instead — get in
          touch and we&rsquo;ll put it right.
        </p>
      </Section>

      <Section id="entitled" number="Section 1" title="When you are entitled to a refund">
        <ScenarioList>
          <Scenario verdict="yes" badge="Full refund" title="You cancel with notice">
            Cancel at least <Pending>free cancellation window</Pending> before your
            arrival window and any deposit is refunded in full, no questions asked.
          </Scenario>
          <Scenario verdict="yes" badge="Full refund" title="We cancel or can't attend">
            Illness, an unsafe site, or anything else on our end. You get your
            deposit back in full and first pick of the next available windows. If
            we&rsquo;d already done part of the work, you only pay for that part.
          </Scenario>
          <Scenario verdict="yes" badge="Full refund" title="We can't do the job safely or lawfully">
            If we find asbestos, unsafe wiring or a structural problem and
            can&rsquo;t proceed, you aren&rsquo;t charged for work we couldn&rsquo;t
            lawfully or safely do.
          </Scenario>
          <Scenario verdict="yes" badge="Refund or fix" title="Major failure under the ACL">
            If our service fails to meet a consumer guarantee and the failure is
            major, you can choose a refund or compensation for the reduced value.
            This applies regardless of anything else in this policy.
          </Scenario>
          <Scenario verdict="maybe" badge="Case by case" title="You cancel inside the notice window">
            We may retain part of the deposit, but only to cover costs we&rsquo;ve
            actually incurred. See section 3.
          </Scenario>
        </ScenarioList>
      </Section>

      <Section id="not-available" number="Section 2" title="When a refund generally isn't available">
        <ScenarioList>
          <Scenario verdict="no" badge="Not eligible" title="Work already completed to standard">
            Once a job is properly done, the price is payable. A problem with the
            quality of the work is a warranty matter, not a cancellation.
          </Scenario>
          <Scenario verdict="no" badge="Not eligible" title="We couldn't get access">
            If we arrive inside the agreed window and can&rsquo;t start — nobody
            over 18 present, the area blocked, or no landlord permission to drill —
            it&rsquo;s treated as a late cancellation. See clause 5 of our{" "}
            <Link href="/legal/terms-of-trade">terms of trade</Link>.
          </Scenario>
          <Scenario verdict="no" badge="Not eligible" title="Change of mind after installation">
            We can remove or relocate an installation, but that&rsquo;s new
            chargeable work rather than a refund.
          </Scenario>
        </ScenarioList>
      </Section>

      <Section id="deposits" number="Section 3" title="How deposits are handled">
        <p>
          Your deposit reserves an installer and an arrival window, and sometimes
          covers materials cut to size for your job specifically.
        </p>
        <Callout>
          <p>
            <strong>We do not keep a deposit merely because a cancellation was
            late.</strong> If we retain any part of it, that is limited to costs we
            have genuinely incurred — and we will tell you what those were and why.
            Anything left over comes back to you.
          </p>
        </Callout>
        <p>
          Rescheduling is different from cancelling. Move your arrival window with
          at least <Pending>reschedule notice period</Pending> notice and there is
          no charge at all — request it from your booking page and we&rsquo;ll offer
          you the next times that suit.
        </p>
      </Section>

      <Section id="how-to" number="Section 4" title="How to cancel or reschedule">
        <Timeline>
          <Step step="Step 1 — Open your booking">
            Go to <Link href="/portal">my bookings</Link> and select the job. Every
            quote and booking you have is listed there.
          </Step>
          <Step step="Step 2 — Choose what you need">
            Use &ldquo;request a different time&rdquo; to reschedule, or email us to
            cancel outright. Tell us roughly what suits you and we&rsquo;ll work
            around it.
          </Step>
          <Step step="Step 3 — We confirm">
            We&rsquo;ll come back to you in writing with the new window, or with
            confirmation of the cancellation and exactly what is being refunded.
          </Step>
          <Step step="Step 4 — Refund issued">
            Any refund goes back by the method you paid. See the processing times
            below.
          </Step>
        </Timeline>
      </Section>

      <Section id="processing" number="Section 5" title="Refund processing times">
        <p>Once a refund is agreed, expect roughly:</p>
        <KeyValueGrid>
          <KeyValue label="Card" value={<Pending>card refund time</Pending>} />
          <KeyValue label="Bank transfer" value={<Pending>transfer refund time</Pending>} />
        </KeyValueGrid>
        <Callout>
          <p>
            The time for money to actually appear depends on your bank and can take
            longer than our processing time.{" "}
            <strong>Refunds are issued to the original payment method only</strong>{" "}
            — we can&rsquo;t refund to a different card, account or person.
          </p>
        </Callout>
      </Section>

      <Section id="consumer" number="Section 6" title="Your rights under the Australian Consumer Law">
        <p>
          <strong>Nothing in this policy limits your rights under the ACL.</strong>{" "}
          For a major failure with our service you are entitled to cancel and
          receive a refund for the unused portion, or compensation for its reduced
          value, plus compensation for any other reasonably foreseeable loss.
        </p>
        <p>
          If the failure isn&rsquo;t major, you are entitled to have the problem
          fixed within a reasonable time — and if we don&rsquo;t, to cancel and get
          a refund for the unused portion.
        </p>
        <Callout>
          <p>
            If we can&rsquo;t resolve something between us, you can contact{" "}
            <strong>Consumer Affairs {BUSINESS.jurisdiction}</strong>, or take a
            domestic building dispute to{" "}
            <strong>Domestic Building Dispute Resolution {BUSINESS.jurisdiction}</strong>.
            Nothing here prevents you exercising any other right you have.
          </p>
        </Callout>
      </Section>

      <Section id="contact" number="Section 7" title="Contact us">
        <KeyValueGrid>
          <KeyValue
            label="Cancellations"
            value={<BusinessValue value={BUSINESS.email} label="contact email" />}
          />
          <KeyValue label="Service area" value={BUSINESS.serviceArea} />
        </KeyValueGrid>
        <p>
          <Pending>Legal review</Pending> — draft for review by an Australian legal
          practitioner. The deposit provisions in section 3 should be checked
          against the unfair contract terms regime, which now carries penalties for
          standard-form consumer contracts.
        </p>
      </Section>
    </LegalPage>
  );
}
