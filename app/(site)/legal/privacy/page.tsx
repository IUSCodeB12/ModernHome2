import Link from "next/link";
import { BUSINESS, contractingName } from "@/lib/business";
import { LegalPage } from "@/components/legal/legal-page";
import {
  Bullet,
  Bullets,
  Callout,
  CardGrid,
  DataCard,
  Notice,
  Section,
  Tile,
  TileGrid,
} from "@/components/legal/legal-blocks";
import { BusinessValue, Pending } from "@/components/legal/pending";

export const metadata = {
  title: "Privacy policy",
  robots: { index: false, follow: false },
};

const TOC = [
  { id: "intro", label: "Introduction" },
  { id: "what-is", label: "1. What is personal information?" },
  { id: "what-collect", label: "2. What we collect" },
  { id: "how-collect", label: "3. How we collect it" },
  { id: "how-use", label: "4. How we use it" },
  { id: "disclosure", label: "5. Disclosure" },
  { id: "overseas", label: "6. Where it's stored" },
  { id: "cookies", label: "7. Cookies" },
  { id: "security", label: "8. Security" },
  { id: "retention", label: "9. Retention" },
  { id: "rights", label: "10. Your rights" },
  { id: "complaints", label: "11. Complaints" },
  { id: "children", label: "12. Children's privacy" },
  { id: "changes", label: "13. Changes" },
  { id: "contact", label: "14. Contact" },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      accent="policy"
      toc={TOC}
      meta={[
        { label: "Last updated", value: "July 2026" },
        { label: "Legislation", value: "Privacy Act 1988 (Cth)" },
        { label: "Principles", value: "Australian Privacy Principles" },
      ]}
    >
      <Notice tag="Privacy Act 1988 (Cth)">
        This policy is prepared in accordance with the Privacy Act 1988 (Cth) and
        the 13 Australian Privacy Principles. Your personal information will only
        be used for the purposes for which it was collected, or directly related
        purposes, unless you consent otherwise.
      </Notice>

      <Section id="intro" number="Introduction" title="Our commitment to your privacy">
        <p>
          {contractingName()} (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
          &ldquo;our&rdquo;) provides home installation services in{" "}
          {BUSINESS.serviceArea}. We collect a small amount of personal
          information to quote your job, arrive at the right address, and invoice
          you for the work.
        </p>
        <p>
          This policy explains what we collect, why, who we share it with, and how
          you can see it, correct it or have it deleted. By getting a quote or
          booking a job you consent to us handling your information as described
          here.
        </p>
      </Section>

      <Section id="what-is" number="Section 1" title="What is personal information?">
        <p>
          <strong>Personal information</strong> means information or an opinion
          about an identified individual, or an individual who is reasonably
          identifiable. For us that means your name, contact details, the address
          we&rsquo;re coming to, and photos you send us of your home.
        </p>
        <p>
          <strong>Sensitive information</strong> is a subset that includes health,
          biometric, racial, political and similar information. We do not collect
          sensitive information, and we do not collect government identifiers or
          card numbers.
        </p>
      </Section>

      <Section id="what-collect" number="Section 2" title="What personal information we collect">
        <CardGrid>
          <DataCard
            title="Your account"
            items={["Full name", "Email address", "Phone number", "Sign-in history"]}
          />
          <DataCard
            title="The job address"
            items={["Street address", "Suburb and postcode", "Access notes", "Parking or entry details"]}
          />
          <DataCard
            title="About the job"
            items={["Answers to quote questions", "Photos of the space", "Service selected", "Any notes you add"]}
          />
          <DataCard
            title="Bookings and payments"
            items={["Quotes and estimates", "Arrival windows", "Invoices and receipts", "Deposit status"]}
          />
        </CardGrid>
        <Callout>
          <p>
            <strong>Photos are the most sensitive thing we hold.</strong> They show
            the inside of your home. They are stored in a private bucket that is
            not reachable from the public web — only you and our staff can open
            them, and only through a temporary signed link.
          </p>
        </Callout>
        <p>
          We do not hold a password for you. Signing in uses a one-time code sent
          to your email address. When card payments are introduced they will be
          handled by a payment provider and card details will never reach our
          systems.
        </p>
      </Section>

      <Section id="how-collect" number="Section 3" title="How we collect your information">
        <p>
          Almost all of it comes directly from you — when you complete the quote
          wizard, create an account, book an arrival window, or email us about a
          job.
        </p>
        <p>
          A small amount is generated by using the site: the cookies that keep you
          signed in and remember your progress through the wizard. We do not buy
          personal information, and we do not receive it from data brokers or
          social platforms.
        </p>
        <Callout>
          <p>
            <strong>Unsolicited information:</strong> if we receive personal
            information we didn&rsquo;t ask for and don&rsquo;t need, we destroy or
            de-identify it as soon as practicable, in line with APP 4.
          </p>
        </Callout>
      </Section>

      <Section id="how-use" number="Section 4" title="How we use your information">
        <Bullets>
          <Bullet>
            <strong>Quoting</strong> — producing a fixed price from your answers
            and photos.
          </Bullet>
          <Bullet>
            <strong>Scheduling</strong> — booking an arrival window and getting an
            installer to your door with the access details they need.
          </Bullet>
          <Bullet>
            <strong>Billing</strong> — issuing invoices and receipts, and recording
            deposits and payments.
          </Bullet>
          <Bullet>
            <strong>Keeping you informed</strong> — confirmations, reminders, and
            letting you know if anything changes.
          </Bullet>
          <Bullet>
            <strong>Legal obligations</strong> — tax and record-keeping
            requirements.
          </Bullet>
        </Bullets>
        <p>
          <strong>
            We do not sell your personal information, and we do not use your photos
            for marketing unless you have separately agreed in writing.
          </strong>
        </p>
      </Section>

      <Section id="disclosure" number="Section 5" title="Who we share it with">
        <p>
          We use a small number of providers to run the business. Each receives
          only what it needs:
        </p>
        <Bullets>
          <Bullet>
            <strong>Supabase</strong> — our database, file storage and sign-in
            system.
          </Bullet>
          <Bullet>
            <strong>Vercel</strong> — website hosting.
          </Bullet>
          <Bullet>
            <strong>Resend</strong> — sending booking confirmations and receipts.
          </Bullet>
          <Bullet>
            <strong>Your installer</strong> — the assigned installer gets the
            address, access notes and job details required to do the work.
          </Bullet>
          <Bullet>
            <strong>Authorities</strong> — where we are required to disclose
            information by law or court order.
          </Bullet>
        </Bullets>
      </Section>

      <Section id="overseas" number="Section 6" title="Where your information is stored">
        <Callout>
          <p>
            <strong>Some of your information is stored outside Australia.</strong>{" "}
            Our database and file storage are hosted in Singapore, and our website
            and email providers operate infrastructure in other countries including
            the United States.
          </p>
        </Callout>
        <p>
          By giving us your information you consent to it being disclosed to and
          held in those locations. We take reasonable steps to ensure our providers
          handle it consistently with the Australian Privacy Principles, but
          overseas providers may also be subject to the laws of their own
          jurisdictions.
        </p>
      </Section>

      <Section id="cookies" number="Section 7" title="Cookies">
        <p>
          We set only the cookies needed to keep you signed in and to remember your
          progress through the quote wizard. These are strictly necessary for the
          site to work.
        </p>
        <p>
          <strong>
            We do not use advertising, analytics or cross-site tracking cookies.
          </strong>{" "}
          If that changes we will update this policy and ask for your consent where
          required.
        </p>
      </Section>

      <Section id="security" number="Section 8" title="How we protect it">
        <Bullets>
          <Bullet>
            Photos of your property sit in a private storage bucket, reachable only
            through short-lived signed links.
          </Bullet>
          <Bullet>
            Database access is scoped per customer, so signing in only ever shows
            you your own quotes, bookings and invoices.
          </Bullet>
          <Bullet>
            Administrator accounts require a second factor in addition to email
            sign-in.
          </Bullet>
          <Bullet>Everything is transmitted over encrypted connections.</Bullet>
        </Bullets>
        <p>
          No system is perfectly secure. If a breach occurs that is likely to cause
          you serious harm, we will notify you and the Office of the Australian
          Information Commissioner as required by the Notifiable Data Breaches
          scheme.
        </p>
      </Section>

      <Section id="retention" number="Section 9" title="How long we keep it">
        <Bullets>
          <Bullet>
            Invoices and job records are kept for five to seven years, because tax
            and consumer law require it.
          </Bullet>
          <Bullet>
            Photos are kept while the job is active and for the warranty period, so
            we can assess a claim against what was there before.
          </Bullet>
          <Bullet>
            Account details are deleted when you delete your account, other than
            the records above.
          </Bullet>
        </Bullets>
        <p>When information is no longer needed we securely destroy or de-identify it.</p>
      </Section>

      <Section id="rights" number="Section 10" title="Your rights — access, correction, deletion">
        <p>
          Under the Privacy Act and the Australian Privacy Principles you have the
          following rights:
        </p>
        <TileGrid>
          <Tile title="Access">
            Ask for a copy of what we hold about you. We respond within 30 days.
          </Tile>
          <Tile title="Correction">
            Ask us to fix anything inaccurate or out of date. We&rsquo;ll correct it
            or explain why not.
          </Tile>
          <Tile title="Deletion">
            Delete your account and photos yourself, any time. Some invoice records
            must be retained by law.
          </Tile>
          <Tile title="Complaint">
            Raise a privacy concern with us, and escalate to the OAIC if
            you&rsquo;re not satisfied.
          </Tile>
        </TileGrid>
        <p>
          Most of this is self-serve: your{" "}
          <Link href="/portal/settings">account settings</Link> let you change your
          details, review your full booking history, and delete your account
          outright.
        </p>
        <p>
          For anything else, email{" "}
          <BusinessValue value={BUSINESS.email} label="contact email" />.
        </p>
      </Section>

      <Section id="complaints" number="Section 11" title="Privacy complaints">
        <p>
          If you think we&rsquo;ve mishandled your personal information, email{" "}
          <BusinessValue value={BUSINESS.email} label="contact email" />. We will
          acknowledge within 5 business days and aim to resolve it within 30 days,
          in writing.
        </p>
        <Callout>
          <p>
            If you&rsquo;re not satisfied with our response you can complain to the{" "}
            <strong>Office of the Australian Information Commissioner</strong>:{" "}
            <a href="https://www.oaic.gov.au" rel="noreferrer" target="_blank">
              oaic.gov.au
            </a>{" "}
            &middot; 1300 363 992 &middot; GPO Box 5218, Sydney NSW 2001.
          </p>
        </Callout>
      </Section>

      <Section id="children" number="Section 12" title="Children's privacy">
        <p>
          Our service is intended for adults arranging work on a property they own
          or occupy. We do not knowingly collect personal information from children.
          If you believe a child has given us information, email us and we will
          delete it promptly.
        </p>
      </Section>

      <Section id="changes" number="Section 13" title="Changes to this policy">
        <p>
          If we change this policy we will update the date at the top. Where a
          change materially affects how we use information you have already given
          us, we will tell you by email.
        </p>
      </Section>

      <Section id="contact" number="Section 14" title="Contact us">
        <Bullets>
          <Bullet>
            <strong>Business:</strong> {contractingName()}
          </Bullet>
          <Bullet>
            <strong>ABN:</strong> <BusinessValue value={BUSINESS.abn} label="ABN" />
          </Bullet>
          <Bullet>
            <strong>ACN:</strong> <BusinessValue value={BUSINESS.acn} label="ACN" />
          </Bullet>
          <Bullet>
            <strong>Email:</strong>{" "}
            <BusinessValue value={BUSINESS.email} label="contact email" />
          </Bullet>
          <Bullet>
            <strong>Service area:</strong> {BUSINESS.serviceArea}
          </Bullet>
        </Bullets>
        <p>
          <Pending>Legal review</Pending> — this document is a draft prepared for
          review by an Australian legal practitioner before it is relied upon.
        </p>
      </Section>
    </LegalPage>
  );
}
