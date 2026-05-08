import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { getServiceSummary } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  type: "vca" | "caregiver" | "household";
  district?: string;
  facility?: string;
}

const COHORTS_BY_TYPE: Record<Props["type"], { key: string; label: string; tone: string }[]> = {
  vca: [
    { key: "clhiv",  label: "CLHIV",  tone: "bg-rose-50 text-rose-700 border-rose-200" },
    { key: "cwlhiv", label: "CWLHIV", tone: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
    { key: "hei",    label: "HEI",    tone: "bg-amber-50 text-amber-700 border-amber-200" },
    { key: "active_this_month", label: "Active this month", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { key: "stale_90d", label: "No service 90d+", tone: "bg-slate-50 text-slate-700 border-slate-200" },
  ],
  caregiver: [
    { key: "cwlhiv",   label: "CWLHIV",   tone: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
    { key: "pregnant", label: "Pregnant", tone: "bg-rose-50 text-rose-700 border-rose-200" },
  ],
  household: [
    { key: "screened",   label: "Screened",   tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { key: "unscreened", label: "Unscreened", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  ],
};

const CohortStrip = ({ type, district, facility }: Props) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["service-summary", type, district, facility],
    queryFn: () => getServiceSummary({ type, district, facility }),
    staleTime: 5 * 60 * 1000,
  });

  if (isError) return null;
  const cohorts = COHORTS_BY_TYPE[type];
  const d = data?.data ?? {};

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 px-1">
      <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <Users className="h-3.5 w-3.5" /> Cohorts
      </span>
      {isLoading ? (
        <div className="flex gap-2">
          {cohorts.map((c) => (
            <div key={c.key} className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
          ))}
        </div>
      ) : (
        cohorts.map((c) => (
          <Badge
            key={c.key}
            variant="outline"
            className={cn("gap-1.5 px-2.5 py-1 text-xs font-medium", c.tone)}
          >
            {c.label}
            <span className="font-mono font-bold">{Number(d[c.key] ?? 0).toLocaleString()}</span>
          </Badge>
        ))
      )}
    </div>
  );
};

export default CohortStrip;
