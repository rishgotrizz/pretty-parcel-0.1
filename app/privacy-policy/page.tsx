const privacySections = [
  {
    title: "Introduction",
    body: "The Pretty Parcel respects your privacy and is committed to protecting your personal information. This Privacy Policy explains what we collect, how we use it, and how we keep it safe when you browse, shop, or contact us through our website."
  },
  {
    title: "Information We Collect",
    body: "We may collect your name, email address, phone number, shipping and billing address, order details, and payment-related information needed to complete your purchase. Payments are processed through secure payment gateways such as Razorpay, so we do not store your full card or banking details on our servers."
  },
  {
    title: "How We Use Information",
    body: "We use your information to process orders, deliver products, provide customer support, send order updates, respond to queries, improve the shopping experience, and share important service-related communication."
  },
  {
    title: "Cookies & Tracking",
    body: "Our website may use cookies, session tools, and basic analytics to understand browsing activity, remember preferences, improve performance, and measure store usage. These tools help us offer a smoother and more personalized experience."
  },
  {
    title: "Data Protection & Security",
    body: "We take reasonable technical and organizational steps to protect your data from unauthorized access, misuse, loss, or disclosure. We also work with secure hosting, authentication, and payment providers to maintain platform safety."
  },
  {
    title: "Sharing of Information",
    body: "We only share necessary information with trusted third-party services involved in running the store, such as payment gateways like Razorpay, delivery partners, and technical infrastructure providers. We do not sell your personal information."
  },
  {
    title: "User Rights",
    body: "You may contact us to review, update, or request deletion of your personal information, subject to applicable legal and business requirements. You may also request clarification about how your data is being used."
  },
  {
    title: "Policy Updates",
    body: "We may update this Privacy Policy from time to time to reflect legal, operational, or platform changes. The latest version on this page will always apply."
  },
  {
    title: "Contact Information",
    body: "If you have any questions about privacy or data handling, please contact us at prachijain2801@gmail.com or call 9767291305."
  }
];

export default function PrivacyPolicyPage() {
  return (
    <div className="section-shell py-12">
      <div className="mx-auto max-w-4xl rounded-[2.5rem] border border-white/70 bg-white/85 p-6 shadow-[var(--shadow-card)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rosewood/65">The Pretty Parcel</p>
        <h1 className="mt-3 font-serif text-4xl text-cocoa sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-rosewood/80">
          This Privacy Policy is designed to keep things clear, simple, and trustworthy for customers shopping with
          The Pretty Parcel.
        </p>

        <div className="mt-10 space-y-6">
          {privacySections.map((section) => (
            <section key={section.title} className="rounded-[1.75rem] bg-rosewater/80 p-5">
              <h2 className="font-serif text-2xl text-cocoa">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-rosewood/80">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
