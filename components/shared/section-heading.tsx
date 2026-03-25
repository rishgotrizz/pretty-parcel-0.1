export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rosewood/70">{eyebrow}</p>
      <h2 className="font-serif text-3xl text-cocoa sm:text-4xl">{title}</h2>
      <p className="text-sm leading-7 text-rosewood/80 sm:text-base">{description}</p>
    </div>
  );
}
