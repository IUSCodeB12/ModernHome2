import Link from "next/link";
import { BUSINESS, contractingName } from "@/lib/business";
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
  title: "Workmanship warranty",
  robots: { index: false, follow: false },
};

const TOC = [
  { id: "intro", label: "Introduction" },
  { id: "covered", label: "1. What is covered" },
  { id: "not-covered", label: "2. What is not covered" },
  { id: "claim", label: "3. How to claim" },
  { id: "outside", label: "4. If a claim isn't covered" },
  { id: "acl", label: "5. Your consumer rights" },
  { id: "contact", label: "6. Contact" },
];

export default function WarrantyPage() {
  return (
    <LegalPage
      title="Workmanship"
      accent="warranty"
      toc={TOC}
      meta={[
        { label: "Last updated", value: "July 2026" },
        { label: "Covers", value: "Installation workmanship" },
        { label: "Period", value: "To be confirmed" },
      ]}
    >
      <Notice tag="Warranty against defects">
        This is a voluntary warranty given by {contractingName()}, in addition to —
        not instead of — the consumer guarantees you have under the Australian
        Consumer Law. Those guarantees cannot be excluded, and can apply for longer
        than the period below.
      </Notice>

      <Section id="intro" number="Introduction" title="What this warranty is">
        <p>
          We advertise a workmanship guarantee, so this page sets out exactly what
          that means — how long it lasts, what it covers, and what it doesn&rsquo;t.
        </p>
        <p>
          In short: if something we installed fails because of{" "}
          <strong>how we installed it</strong>, we come back and fix it at no cost
          to you.
        </p>
      </Section>

      <Section id="covered" number="Section 1" title="What is covered">
        <p>
          For <Pending>warranty period</Pending> from the day we complete your job:
        </p>
        <ScenarioList>
          <Scenario verdict="yes" badge="Covered" title="Fixings that work loose">
            A mount, bracket or cabinet that loosens because of how it was fixed to
            the wall.
          </Scenario>
          <Scenario verdict="yes" badge="Covered" title="Wrong fixings for your wall">
            Hardware used that wasn&rsquo;t suitable for your wall type —
            plasterboard, brick or concrete.
          </Scenario>
          <Scenario verdict="yes" badge="Covered" title="Unfinished cabling or concealment">
            Cable work or in-wall concealment that wasn&rsquo;t completed properly or
            left untidy.
          </Scenario>
          <Scenario verdict="yes" badge="Covered" title="Lighting or heating that doesn't work">
            An LED run or heater that doesn&rsquo;t operate because of our
            installation, as distinct from a fault in the product itself.
          </Scenario>
          <Scenario verdict="yes" badge="Covered" title="Not level, secure or safe">
            Anything we left that isn&rsquo;t plumb, isn&rsquo;t secure, or
            isn&rsquo;t safe.
          </Scenario>
        </ScenarioList>
      </Section>

      <Section id="not-covered" number="Section 2" title="What is not covered">
        <ScenarioList>
          <Scenario verdict="no" badge="Not covered" title="Faults in the appliance itself">
            A TV, heater or light fitting that fails is a manufacturer matter. That
            warranty belongs to you — we&rsquo;ll help point you in the right
            direction.
          </Scenario>
          <Scenario verdict="no" badge="Not covered" title="Changes made by someone else">
            If the item is removed, re-mounted or altered by anyone other than us,
            this warranty stops applying to that work.
          </Scenario>
          <Scenario verdict="no" badge="Not covered" title="Misuse, accident or overloading">
            Hanging extra weight from a mount, or exceeding the appliance&rsquo;s
            rated size.
          </Scenario>
          <Scenario verdict="no" badge="Not covered" title="Building movement or hidden defects">
            Pre-existing problems in the wall or structure, including conditions that
            were concealed and not disclosed at quote time.
          </Scenario>
          <Scenario verdict="no" badge="Not covered" title="Wear and pre-existing marks">
            Normal wear, and cosmetic marks that were there before we started.
          </Scenario>
        </ScenarioList>
      </Section>

      <Section id="claim" number="Section 3" title="How to make a claim">
        <Timeline>
          <Step step="Step 1 — Send us the details">
            Email <BusinessValue value={BUSINESS.email} label="contact email" /> with
            your booking reference and a photo of the problem. Your reference is on
            your invoice, downloadable from <Link href="/portal">my bookings</Link>.
          </Step>
          <Step step="Step 2 — We respond">
            We&rsquo;ll come back to you within{" "}
            <Pending>warranty response time</Pending> and tell you whether
            it&rsquo;s covered.
          </Step>
          <Step step="Step 3 — We book a return visit">
            Where the claim is covered we book a time that suits you.{" "}
            <strong>There is no callout fee for a warranty visit.</strong>
          </Step>
          <Step step="Step 4 — We fix it">
            We put the work right at no cost to you.
          </Step>
        </Timeline>
      </Section>

      <Section id="outside" number="Section 4" title="If a claim isn't covered">
        <p>
          If we attend and find the cause falls outside this warranty, we will tell
          you <strong>before doing any chargeable work</strong> and quote you for the
          repair. You are free to decline.
        </p>
      </Section>

      <Section id="acl" number="Section 5" title="Your rights under the Australian Consumer Law">
        <Callout>
          <p>
            <strong>
              Our goods and services come with guarantees that cannot be excluded
              under the Australian Consumer Law.
            </strong>
          </p>
        </Callout>
        <p>
          For services, you are entitled to have a problem fixed — or, if it
          can&rsquo;t be fixed within a reasonable time, to cancel and get a refund.
          If the failure is major you may be entitled to a refund or compensation for
          any reasonably foreseeable loss.
        </p>
        <p>
          The benefits of this workmanship warranty are{" "}
          <strong>in addition to</strong> those rights. Nothing here limits them, and
          the period above does not cap them — a consumer guarantee can apply for
          longer than a voluntary warranty, depending on the circumstances.
        </p>
      </Section>

      <Section id="contact" number="Section 6" title="Who to contact">
        <KeyValueGrid>
          <KeyValue label="Business" value={contractingName()} />
          <KeyValue label="ABN" value={<BusinessValue value={BUSINESS.abn} label="ABN" />} />
          <KeyValue
            label="Warranty claims"
            value={<BusinessValue value={BUSINESS.email} label="contact email" />}
          />
          <KeyValue label="Service area" value={BUSINESS.serviceArea} />
        </KeyValueGrid>
        <p>
          <Pending>Legal review</Pending> — draft for review by an Australian legal
          practitioner. A voluntary warranty of this kind is a &ldquo;warranty
          against defects&rdquo; under the Australian Consumer Law and must carry
          prescribed wording; that requirement should be confirmed before
          publication.
        </p>
      </Section>
    </LegalPage>
  );
}
