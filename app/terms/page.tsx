export default function TermsPage() {
  return (
    <div className="section-shell py-12">
      <div className="mx-auto max-w-4xl rounded-[2.5rem] border border-white/70 bg-white/85 p-6 shadow-[var(--shadow-card)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rosewood/65">The Pretty Parcel</p>
        <h1 className="mt-3 font-serif text-4xl text-cocoa sm:text-5xl">Terms & Conditions</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-rosewood/80">
          Please review these policies before placing an order. Every product is handmade with care and may include
          slight artisanal variations.
        </p>

        <div className="mt-10 space-y-6">
          {[
            {
              title: "No return policy",
              body: "Because each gift is handmade or personalized, we do not accept returns once an order has been confirmed."
            },
            {
              title: "No refund policy",
              body: "Refunds are not offered for change-of-mind purchases. If something arrives damaged, please contact us within 24 hours so we can review the issue."
            },
            {
              title: "Handmade product disclaimer",
              body: "Minor variations in flowers, colors, texture, and finishing are part of the handmade process and make each parcel unique."
            },
            {
              title: "Delivery timelines",
              body: "Most orders are dispatched within 3 to 7 business days. Custom orders may require additional making time depending on complexity."
            },
            {
              title: "Damage handling policy",
              body: "If your parcel is damaged in transit, send us clear photos of the package and product within 24 hours of delivery so we can assist promptly."
            },
            {
              title: "Contact information",
              body: "For support, reach out via Instagram at @theprettyparcel._ or email hello@theprettyparcel.com."
            }
          ].map((section) => (
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
