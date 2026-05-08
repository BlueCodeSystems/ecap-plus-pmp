import { useQuery } from "@tanstack/react-query";
import { Database, Info, TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";
import { getServiceSummary } from "@/lib/api";
import GlowCard from "@/components/aceternity/GlowCard";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingDots from "@/components/aceternity/LoadingDots";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  type: "vca" | "caregiver" | "household";
  district?: string;
  facility?: string;
}

interface Stat { key: string; label: string; tooltip?: string; format?: (n: number) => string }

// Strictly the values that are NOT already shown in KPICards / Action Queue / DQ
// insights — keeps the strip focused on "DB-canonical totals + this month".
const STATS_BY_TYPE: Record<Props["type"], Stat[]> = {
  vca: [
    { key: "enrolled",            label: "VCAs enrolled",       tooltip: "All VCAs ever enrolled into the programme — includes active, exited, graduated, and transferred cases. This is the cumulative total." },
    { key: "active",              label: "Active CAs",          tooltip: "VCAs whose case is currently open (case_status = 'Active'). Excludes exited, graduated, and transferred cases. The difference between Enrolled and Active is the count of closed cases." },
    { key: "services_this_month", label: "Services this month", tooltip: "Service events recorded in vca_services with a service_date in the current calendar month. One VCA can have many service events in the same month." },
  ],
  caregiver: [
    { key: "enrolled",            label: "Caregivers enrolled", tooltip: "All caregivers (one per household) ever enrolled — cumulative across the programme's lifetime, including exited and graduated households." },
    { key: "active",              label: "Active",              tooltip: "Caregivers in households whose case is currently open. Excludes households that have been exited, graduated, or transferred. Enrolled minus Active = closed cases." },
    { key: "services_this_month", label: "Services this month", tooltip: "Caregiver service events recorded in the current calendar month. Counts events, not unique caregivers — one caregiver can receive several services in a month." },
  ],
  household: [
    { key: "enrolled",            label: "Households enrolled", tooltip: "All households ever enrolled into the programme — cumulative total including those that have since exited, graduated, or been transferred. Use this for lifetime reach." },
    { key: "active",              label: "Active",              tooltip: "Households whose case is currently open (case_status = 'Active'). Excludes exited, graduated, and transferred households. Enrolled minus Active = households that have closed since enrolment." },
    { key: "services_this_month", label: "Services this month", tooltip: "Household-level service events recorded in the current calendar month. One household can have multiple service events." },
  ],
};

const TrendBadge = ({ pct }: { pct: number }) => {
  const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus;
  const cls = pct > 0 ? "text-emerald-600 bg-emerald-50 border-emerald-200" : pct < 0 ? "text-rose-600 bg-rose-50 border-rose-200" : "text-slate-500 bg-slate-50 border-slate-200";
  return (
    <Badge variant="outline" className={cn("text-[10px] gap-1", cls)}>
      <Icon className="h-3 w-3" /> {pct > 0 ? "+" : ""}{pct}% MoM
    </Badge>
  );
};

const CanonicalKpiStrip = ({ type, district, facility }: Props) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["service-summary", type, district, facility],
    queryFn: () => getServiceSummary({ type, district, facility }),
    staleTime: 5 * 60 * 1000,
  });

  if (isError) return null;
  const stats = STATS_BY_TYPE[type];
  const d = data?.data ?? {};
  const trend = Number(d.mom_trend_pct ?? 0);

  return (
    <GlowCard className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4 text-primary" />
            Canonical KPIs
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
              <Info className="h-3 w-3" /> data warehouse
            </Badge>
            {!isLoading && data?.data && <TrendBadge pct={trend} />}
          </CardTitle>
          {data?.generated_at && (
            <span className="text-[10px] text-slate-400">
              {new Date(data.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="py-4 flex items-center justify-center"><LoadingDots className="text-slate-400" /></div>
        ) : (
          <TooltipProvider delayDuration={150}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.key} className="rounded-md border border-slate-100 bg-slate-50/30 p-2">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span className="truncate" title={s.label}>{s.label}</span>
                    {s.tooltip && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="shrink-0 text-slate-400 hover:text-slate-600" aria-label={`What is ${s.label}?`}>
                            <HelpCircle className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                          {s.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-lg font-bold text-slate-800">
                    {(s.format ?? ((n) => n.toLocaleString()))(Number(d[s.key] ?? 0))}
                  </div>
                </div>
              ))}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </GlowCard>
  );
};

export default CanonicalKpiStrip;
