import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type GlowCardProps = {
  children: ReactNode;
  className?: string;
  wrapperClassName?: string;
};

const GlowCard = ({ children, className, wrapperClassName }: GlowCardProps) => {
  return (
    <div className={cn("group relative", wrapperClassName)}>
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-rose-300/30 via-pink-200/25 to-transparent opacity-60 blur-lg transition-opacity duration-500 group-hover:opacity-100" />
      <Card
        className={cn(
          "relative rounded-2xl border border-slate-200/70 bg-white/85 backdrop-blur-xl shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.02]",
          className,
        )}
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/70" />
        <div className="relative z-10">{children}</div>
      </Card>
    </div>
  );
};

export default GlowCard;
