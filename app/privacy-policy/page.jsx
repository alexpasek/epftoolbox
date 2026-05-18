export const metadata = {
  title: "Privacy Policy | EPF Toolbox",
  description: "Privacy policy for EPF Toolbox CRM and GPT lead intake.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <article className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-rose-600">EPF Toolbox</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: May 18, 2026</p>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="text-sm leading-6 text-slate-700">
            EPF Toolbox is an internal business tool used to manage renovation
            leads, estimates, invoices, and customer follow-up. This policy
            explains how information submitted through the CRM and GPT lead
            intake API is handled.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold">Information We Collect</h2>
          <p className="text-sm leading-6 text-slate-700">
            We may collect lead and customer information such as name, phone
            number, email address, project address, city, requested service,
            project notes, estimate details, payment status, and communication
            history.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold">How Information Is Used</h2>
          <p className="text-sm leading-6 text-slate-700">
            Information is used only to respond to customer inquiries, schedule
            estimates, prepare quotes or invoices, manage project status, and
            follow up with customers about renovation services.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold">GPT Action Use</h2>
          <p className="text-sm leading-6 text-slate-700">
            When a GPT action sends lead information to EPF Toolbox, the data is
            saved into the CRM so the business can contact the customer and
            manage the lead. The GPT action should send only information needed
            for the CRM lead or customer request.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold">Storage and Security</h2>
          <p className="text-sm leading-6 text-slate-700">
            CRM data is stored in the project&apos;s configured Cloudflare
            storage. The external CRM API requires a bearer token before it can
            create leads. Access to the CRM is limited to authorized business
            users.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold">Sharing</h2>
          <p className="text-sm leading-6 text-slate-700">
            We do not sell customer information. Information may be shared only
            when needed to operate the business, complete customer-requested
            services, comply with legal obligations, or maintain the hosting and
            storage systems used by the application.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold">Retention</h2>
          <p className="text-sm leading-6 text-slate-700">
            CRM records may be kept for business records, customer service, and
            project history unless deletion is requested and no legal or
            business record requirement applies.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="text-sm leading-6 text-slate-700">
            To request access, correction, or deletion of information, contact:
            <br />
            <a className="font-medium text-rose-600 hover:underline" href="mailto:webtoronto22@gmail.com">
              webtoronto22@gmail.com
            </a>
          </p>
        </section>
      </article>
    </main>
  );
}
