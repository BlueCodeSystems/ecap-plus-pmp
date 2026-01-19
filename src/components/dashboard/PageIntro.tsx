import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageIntroProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

const PageIntro = ({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageIntroProps) => {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}
    </div>
  );
};

export default PageIntro;
