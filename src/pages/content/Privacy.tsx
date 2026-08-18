export default function Privacy() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-10 text-slate-100">
      <article className="mx-auto max-w-4xl rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl sm:p-10">
        <h1 className="mb-6 text-4xl font-bold text-amber-300">Privacy Policy for PaladinHub</h1>
        <p>At PaladinHub, accessible from PaladinHub.com, one of our main priorities is the privacy of our visitors. This Privacy Policy describes the information collected and recorded by PaladinHub and how we use it.</p>
        <p className="mt-4">For additional questions or more information about this Privacy Policy, contact PaladinHub.</p>
        <p className="mt-4">This policy applies to online activity and to information visitors share with or that is collected by PaladinHub. It does not apply to information collected offline or through channels other than this website.</p>

        <Section title="Consent">
          <p>By using this website, you consent to this Privacy Policy and agree to its terms.</p>
        </Section>

        <Section title="Information we collect">
          <p>The personal information requested from you, and the reason for requesting it, will be made clear when it is requested.</p>
          <p>If you contact us directly, we may receive information such as your name, email address, phone number, message contents, attachments and any other information you provide.</p>
          <p>When registering an account, we may request contact information including your name, company name, address, email address and telephone number.</p>
        </Section>

        <Section title="How we use your information">
          <ul className="list-disc space-y-2 pl-6">
            <li>Provide, operate and maintain the website.</li>
            <li>Improve, personalize and expand the website.</li>
            <li>Understand and analyze how the website is used.</li>
            <li>Develop new products, services, features and functionality.</li>
            <li>Communicate with users for support, updates, marketing and promotional purposes.</li>
            <li>Send emails.</li>
            <li>Find and prevent fraud.</li>
          </ul>
        </Section>

        <Section title="Log files">
          <p>PaladinHub follows a standard procedure of using log files. Logged information may include IP addresses, browser type, internet service provider, date and time, referring or exit pages and click counts. This information is not linked to personally identifiable information and is used for analytics, administration, usage trends and demographic information.</p>
        </Section>

        <Section title="Cookies and web beacons">
          <p>PaladinHub uses cookies to store visitor preferences and information about pages accessed or visited. This information is used to optimize the experience by adapting content to browser and preference information.</p>
        </Section>

        <Section title="Advertising partners">
          <p>Third-party advertising servers or networks may use cookies, JavaScript or web beacons in advertisements and links displayed through PaladinHub. They may automatically receive your IP address. PaladinHub does not control cookies used by third-party advertisers.</p>
        </Section>

        <Section title="Third-party privacy policies">
          <p>PaladinHub&apos;s Privacy Policy does not apply to other advertisers or websites. Consult their privacy policies for detailed practices and opt-out instructions. Cookies can also be disabled through your browser settings.</p>
        </Section>

        <Section title="CCPA privacy rights">
          <p>California consumers may request disclosure of categories and specific pieces of personal data collected, request deletion of collected personal data and request that personal data not be sold. We aim to respond to valid requests within one month.</p>
        </Section>

        <Section title="GDPR data protection rights">
          <ul className="list-disc space-y-2 pl-6">
            <li>The right to access copies of your personal data.</li>
            <li>The right to rectification of inaccurate or incomplete information.</li>
            <li>The right to erasure under applicable conditions.</li>
            <li>The right to restrict processing under applicable conditions.</li>
            <li>The right to object to processing under applicable conditions.</li>
            <li>The right to data portability under applicable conditions.</li>
          </ul>
          <p className="mt-3">We aim to respond to valid requests within one month.</p>
        </Section>

        <Section title="Children&apos;s information">
          <p>PaladinHub does not knowingly collect personally identifiable information from children under 13. Parents or guardians who believe a child supplied such information should contact us so it can be removed promptly.</p>
        </Section>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 space-y-3 text-slate-300">
      <h2 className="text-2xl font-semibold text-slate-100">{title}</h2>
      {children}
    </section>
  );
}
