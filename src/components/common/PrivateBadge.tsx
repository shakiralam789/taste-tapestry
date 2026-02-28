import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrivateBadgeProps {
  className?: string;
}

export function PrivateBadge({ className }: PrivateBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200 border border-white/20",
        className,
      )}
    >
      <Lock className="w-3 h-3" />
      Private
    </span>
  );
}

