import { Stethoscope, Activity, Sparkles, Baby } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EmptyState from "@/components/EmptyState";
import GlowCard from "@/components/aceternity/GlowCard";
import { Badge } from "@/components/ui/badge";

const PMTCTRegister = () => {
  const dateStr = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <DashboardLayout subtitle="PMTCT Register">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-emerald-200/60 bg-white/70 backdrop-blur-xl shadow-[0_30px_80px_-50px_rgba(15,118,110,0.55)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_30%,rgba(244,114,182,0.15),transparent_45%)]" />
        <div className="pointer-events-none absolute -top-40 -left-32 h-[24rem] w-[24rem] rounded-full bg-emerald-300/40 blur-[110px] animate-pulse [animation-duration:6s]" />
        <div className="pointer-events-none absolute -bottom-32 right-[-6rem] h-[26rem] w-[26rem] rounded-full bg-pink-300/30 blur-[120px] animate-pulse [animation-duration:8s] [animation-delay:-3s]" />

        <div className="relative z-10 flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">PMTCT register</span>
              <span className="text-slate-400 text-[11px]">·</span>
              <span className="text-[11px] text-slate-600">{dateStr}</span>
              <Badge variant="outline" className="ml-1 gap-1 border-amber-200 bg-amber-50/80 text-[10px] text-amber-700">
                <Activity className="h-3 w-3" /> Coming soon
              </Badge>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-pink-700 bg-clip-text text-transparent">
                Prevention of Mother-to-Child Transmission
              </span>
              <Badge variant="outline" className="ml-2 gap-1 border-emerald-200 bg-white/70 align-middle text-[10px] text-emerald-700 shadow-sm">
                <Baby className="h-3 w-3" /> Maternal · Infant · Linkage
              </Badge>
            </h1>
            <p className="mt-1 text-xs text-slate-600">Integrated tracking for maternal and infant health services with seamless clinical follow-up.</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute -inset-[1px] -z-10 rounded-2xl bg-gradient-to-br from-emerald-200/40 via-teal-200/25 to-pink-200/20 opacity-50 blur-md" />
        <GlowCard className="p-8">
          <EmptyState
            icon={<Stethoscope className="h-12 w-12 text-emerald-600" />}
            title="PMTCT Module Coming Soon"
            description="The Prevention of Mother-to-Child Transmission (PMTCT) module is under development. It will provide integrated tracking for maternal and infant health services, ensuring seamless clinical follow-up."
          />
        </GlowCard>
      </div>
    </DashboardLayout>
  );
};

export default PMTCTRegister;
