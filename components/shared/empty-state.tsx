export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-panel rounded-[2rem] border border-white/70 p-10 text-center">
      <h2 className="font-serif text-3xl text-cocoa">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-rosewood/80">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
