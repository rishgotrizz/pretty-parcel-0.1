export default function ContactPage() {
  return (
    <div className="section-shell py-12">
      <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-white/70 bg-white/85 p-6 shadow-[var(--shadow-card)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rosewood/65">The Pretty Parcel</p>
        <h1 className="mt-3 font-serif text-4xl text-cocoa sm:text-5xl">Contact Us</h1>
        <p className="mt-4 text-sm leading-7 text-rosewood/80">
          We love helping with gifting questions, custom requests, and order support. If you need anything, reach out
          and we&apos;ll be happy to help.
        </p>

        <div className="mt-10 grid gap-5">
          <section className="rounded-[1.75rem] bg-rosewater/80 p-5">
            <h2 className="font-serif text-2xl text-cocoa">Contact Details</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-rosewood/85">
              <p>
                <span className="font-semibold text-cocoa">Phone:</span> 9767291305
              </p>
              <p>
                <span className="font-semibold text-cocoa">Email:</span> prachijain2801@gmail.com
              </p>
            </div>
          </section>

          <section className="rounded-[1.75rem] bg-white/80 p-5">
            <h2 className="font-serif text-2xl text-cocoa">We usually respond within 24 hours</h2>
            <p className="mt-3 text-sm leading-7 text-rosewood/80">
              Whether you&apos;re planning a special surprise or checking on an order, we&apos;ll do our best to get back to
              you quickly with a warm and helpful reply.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
