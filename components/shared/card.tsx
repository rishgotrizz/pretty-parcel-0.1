import { cn } from "@/lib/utils";

export function Card({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("ui-card", className)}>{children}</div>;
}
