import { cn } from "@/lib/utils";

interface DraftBadgeProps {
  className?: string;
}

export function DraftBadge({ className }: DraftBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-gray-500/50 px-2 py-0.5 text-xs font-medium text-gray-300 ring-1 ring-inset ring-gray-500/50 backdrop-blur-sm",
        className,
      )}
    >
      Draft
    </span>
  );
}
