import { cn } from "@/lib/utils";

type LoadingDotsProps = {
  className?: string;
};

const LoadingDots = ({ className }: LoadingDotsProps) => {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-live="polite">
      <span className="h-2 w-2 rounded-full bg-gradient-to-br from-amber-300 via-teal-200 to-slate-200 shadow-[0_0_12px_rgba(16,185,129,0.45)] animate-bounce [animation-delay:-0.2s]" />
      <span className="h-2 w-2 rounded-full bg-gradient-to-br from-amber-300 via-teal-200 to-slate-200 shadow-[0_0_12px_rgba(16,185,129,0.45)] animate-bounce [animation-delay:-0.1s]" />
      <span className="h-2 w-2 rounded-full bg-gradient-to-br from-amber-300 via-teal-200 to-slate-200 shadow-[0_0_12px_rgba(16,185,129,0.45)] animate-bounce" />
    </span>
  );
};

export default LoadingDots;
