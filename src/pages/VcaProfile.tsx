import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChildrenByDistrict,
  getChildrenArchivedRegister,
  DEFAULT_DISTRICT,
  getVcaServicesByDistrict,
  getVcaReferralsById,
  getVcaCasePlansById,
  getFlaggedRecords,
  getVcaServicesByChildId,
  createFlaggedRecord,
  updateFlagStatus
} from "@/lib/api";
import { useMemo, useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { notifyUsersOfFlag, notifyUsersOfFlagResolution } from "@/lib/directus";
import { format } from "date-fns";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  ClipboardCheck,
  Baby,
  HeartPulse,
  FileText,
  Activity,
  Link2,
  ShieldCheck,
  Flag,
  AlertTriangle,
  CheckCircle2,

  AlertCircle,
  PlusCircle,
  Sparkles,
  Archive
} from "lucide-react";
import LoadingDots from "@/components/aceternity/LoadingDots";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn, toTitleCase } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import EmptyState from "@/components/EmptyState";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// PBFW removed; the three derived PBFW sub-populations are computed per-VCA
// at render time (see below). Other generic subpop labels remain.
const subPopulationFilterLabels: Record<string, string> = {
  calhiv: 'C/ALHIV',
  hei: 'HEI',
  cwlhiv: 'C/WLHIV',
  agyw: 'AGYW',
  csv: 'C/SV',
  cfsw: 'CFSW',
  abym: 'ABYM',
  caahh: 'CAAHH',
  caichh: 'CAICHH',
  caich: 'CAICH',
  calwd: 'CALWD',
  caifhh: 'CAIFHH',
  muc: 'MUC',
};

const calculateAge = (birthdate: any): number => {
  if (!birthdate) return 0;
  const dateStr = String(birthdate);
  const formats = [
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  ];
  let parsedDate: Date | null = null;
  for (const format of formats) {
    const parts = dateStr.match(format);
    if (parts) {
      if (format === formats[0]) {
        parsedDate = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
      } else if (format === formats[1]) {
        parsedDate = new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]));
      } else {
        parsedDate = new Date(parseInt(parts[3]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      break;
    }
  }
  if (!parsedDate && !isNaN(Date.parse(dateStr))) {
    parsedDate = new Date(dateStr);
  }
  if (!parsedDate || isNaN(parsedDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - parsedDate.getFullYear();
  const m = today.getMonth() - parsedDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < parsedDate.getDate())) age--;
  return age;
};

const safeParseDate = (dateStr: any) => {
  if (!dateStr) return 0;
  const str = String(dateStr);
  const dmY = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmY) {
    return new Date(parseInt(dmY[3]), parseInt(dmY[2]) - 1, parseInt(dmY[1])).getTime();
  }
  const parsed = Date.parse(str);
  return isNaN(parsed) ? 0 : parsed;
};

const flagSchema = z.object({
  category: z.string().optional(),
  severity: z.string().optional(),
  comment: z.string().min(10, { message: "Observation details must be at least 10 characters" }),
});

const SUB_POPULATION_LABELS = subPopulationFilterLabels;

const VcaProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Retrieve ID from location state or sessionStorage fallback
  const id = useMemo(() => {
    const stateId = location.state?.id;
    if (stateId) {
      sessionStorage.setItem('ecap_last_vca_id', stateId);
      return stateId;
    }
    return sessionStorage.getItem('ecap_last_vca_id');
  }, [location.state?.id]);

  const { user } = useAuth();
  const isDistrictUser = user?.description === "District User";
  // Admins and Provincial Users have global view access at the profile level
  const district = isDistrictUser ? (user?.location || "None") : "";

  const { data: vcas, isLoading: isLoadingActive } = useQuery({
    queryKey: ["vcas", "district", district],
    queryFn: () => getChildrenByDistrict(district),
    enabled: true,
  });

  const { data: archivedVcas, isLoading: isLoadingArchived } = useQuery({
    queryKey: ["vcas", "archived", "district", district],
    queryFn: () => getChildrenArchivedRegister(district),
    enabled: true,
  });

  const { data: vcaServices, isLoading: isLoadingVcaServices } = useQuery({
    queryKey: ["vca-services", "vca", id],
    queryFn: () => getVcaServicesByChildId(id ?? ""),
    enabled: Boolean(id),
  });

  const { data: vcaReferrals = [], isLoading: isLoadingReferrals } = useQuery({
    queryKey: ["vca-referrals", id],
    queryFn: () => getVcaReferralsById(id ?? ""),
    enabled: Boolean(id),
  });

  const { data: vcaCasePlans = [], isLoading: isLoadingCasePlans } = useQuery({
    queryKey: ["vca-caseplans", "vca", id],
    queryFn: () => getVcaCasePlansById(id ?? ""),
    enabled: Boolean(id),
  });

  const { data: allFlags = [], isLoading: isLoadingFlags } = useQuery({
    queryKey: ["flagged-records"],
    queryFn: getFlaggedRecords,
  });

  const vcaFlags = useMemo(() => {
    if (!allFlags || !id) return [];
    return allFlags.filter((f: any) => {
      const vId = id.toLowerCase();
      const matchId = String(f.vca_id || f.child_id || "").toLowerCase() === vId;
      return matchId && f.status !== "resolved";
    });
  }, [allFlags, id]);

  const sortedCasePlans = useMemo(() => {
    return [...vcaCasePlans].sort((a: any, b: any) => {
      const dateA = safeParseDate(a.case_plan_date || a.date_of_caseplan || a.date);
      const dateB = safeParseDate(b.case_plan_date || b.date_of_caseplan || b.date);
      return dateB - dateA;
    });
  }, [vcaCasePlans]);

  const sortedVcaServices = useMemo(() => {
    if (!vcaServices) return [];
    return [...vcaServices].sort((a: any, b: any) => {
      const dateA = safeParseDate(a.service_date || a.visit_date || a.date);
      const dateB = safeParseDate(b.service_date || b.visit_date || b.date);
      return dateB - dateA;
    });
  }, [vcaServices]);

  const { data: flaggedRecords } = useQuery({
    queryKey: ["flagged-records"],
    queryFn: () => getFlaggedRecords(),
  });

  const vca = useMemo(() => {
    return [...(vcas || []), ...(archivedVcas || [])].find((v: any) => {
      const vId = id?.toLowerCase();
      return (
        String(v.uid || "").toLowerCase() === vId ||
        String(v.unique_id || "").toLowerCase() === vId ||
        String(v.vca_id || "").toLowerCase() === vId ||
        String(v.id || "").toLowerCase() === vId
      );
    });
  }, [vcas, archivedVcas, id]);

  /* Removed old vcaServices useMemo since we now fetch directly
  const vcaServices = useMemo(() => {
    if (!allServices || !id) return [];
    return allServices.filter((s: any) => {
      //...
    });
  }, [allServices, id]);
  */



  const sortedReferrals = useMemo(() => {
    return [...vcaReferrals].sort((a: any, b: any) => {
      const dateA = safeParseDate(a.service_date || a.visit_date || a.date || a.referral_date);
      const dateB = safeParseDate(b.service_date || b.visit_date || b.date || b.referral_date);
      return dateB - dateA;
    });
  }, [vcaReferrals]);


  const form = useForm<z.infer<typeof flagSchema>>({
    resolver: zodResolver(flagSchema),
    defaultValues: {
      category: "",
      severity: "",
      comment: "",
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (flagId: string) => {
      await updateFlagStatus(flagId, "resolved");
      const resolver = user ? `${user.first_name} ${user.last_name}` : "Unknown Resolver";
      const record = vcaFlags.find((f: any) => f.id === flagId);
      if (record) {
        await notifyUsersOfFlagResolution(String(record.household_id ?? ""), resolver, "Resolved from VCA profile.", String(record.vca_id ?? ""));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flagged-records"] });
      toast.success("Flag resolved", { description: "Caseworker and admins have been notified." });
    },
    onError: (err: any) => {
      toast.error("Failed to resolve flag", { description: err.message });
    }
  });

  const handleResolve = (flagId: string) => {
    resolveMutation.mutate(flagId);
  };

  const mutation = useMutation({
    mutationFn: createFlaggedRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flagged-records"] });
      const verifier = user ? `${user.first_name} ${user.last_name}` : "Unknown Verifier";
      notifyUsersOfFlag(((vca as any).household_id || "N/A"), verifier, form.getValues("comment") as string, id || "N/A");

      toast.success("Flag submitted successfully", {
        description: "The record has been flagged for review.",
      });
      form.reset();
    },
    onError: (err: Error) => {
      toast.error("Submission failed", {
        description: err.message || "Please try again later.",
      });
    },
  });

  const onFlagSubmit = (values: z.infer<typeof flagSchema>) => {
    const verifier = user ? `${user.first_name} ${user.last_name}` : "Unknown Verifier";
    const payload = {
      household_id: vca.household_id || "N/A",
      vca_id: id,
      caseworker_phone: vca.caseworker_phone || "N/A",
      caseworker_name: vca.caseworker_name || vca.cwac_member_name || "N/A",
      caregiver_name: vca.caregiver_name || "N/A",
      facility: vca.facility || vca.health_facility || "N/A",
      comment: values.comment,
      category: values.category,
      severity: values.severity,
      verifier,
      status: "pending",
    };
    mutation.mutate(payload);
  };

  if (isLoadingActive || isLoadingArchived) {
    return (
      <DashboardLayout subtitle="Vca profile">
        <div className="flex h-[50vh] items-center justify-center">
          <LoadingDots />
        </div>
      </DashboardLayout>
    );
  }

  if (!vca) {
    return (
      <DashboardLayout subtitle="Vca not found">
        <EmptyState
          icon={<User className="h-7 w-7" />}
          title="Vca not found"
          description="The VCA record you're looking for doesn't exist or has been moved."
          action={{ label: "Back to Register", onClick: () => navigate("/vcas") }}
          className="h-[50vh]"
        />
      </DashboardLayout>
    );
  }

  const fullName = `${vca.firstname || vca.name || ""} ${vca.lastname || ""}`.trim() || "N/A";
  const age = calculateAge(vca.birthdate);
  const isArchived = Boolean(vca.de_registration_date || vca.reason);
  const gender = String(vca.vca_gender || vca.gender || "").toLowerCase();
  const isMale = gender === "male" || gender === "m";

  // Pick the latest service date dynamically from the sorted services list
  const lastServiceDate = sortedVcaServices[0]?.service_date || vca.last_service_date || "N/A";

  const dateStr = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <DashboardLayout subtitle={`Vca: ${id}`}>
      <div className="space-y-6 pb-20">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-white/70 backdrop-blur-xl shadow-[0_30px_80px_-50px_rgba(15,118,110,0.55)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(16,185,129,0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_30%,rgba(139,92,246,0.15),transparent_45%)]" />
          <div className="pointer-events-none absolute -top-40 -left-32 h-[24rem] w-[24rem] rounded-full bg-emerald-300/40 blur-[110px] animate-pulse [animation-duration:6s]" />
          <div className="pointer-events-none absolute -bottom-32 right-[-6rem] h-[26rem] w-[26rem] rounded-full bg-violet-300/30 blur-[120px] animate-pulse [animation-duration:8s] [animation-delay:-3s]" />

          <div className="relative z-10 flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">VCA profile</span>
                <span className="text-slate-400 text-[11px]">·</span>
                <span className="text-[11px] text-slate-600">{dateStr}</span>
                <Badge variant="outline" className={cn(
                  "ml-1 gap-1 text-[10px]",
                  isArchived
                    ? "border-amber-200 bg-amber-50/80 text-amber-700"
                    : "border-emerald-200 bg-emerald-50/80 text-emerald-700"
                )}>
                  {isArchived ? <Archive className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                  {isArchived ? "Deregistered" : "Active"}
                </Badge>
                {vca.virally_suppressed === "YES" && (
                  <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50/80 text-[10px] text-emerald-700">
                    <ShieldCheck className="h-3 w-3" /> Suppressed
                  </Badge>
                )}
              </div>
              <h1 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-violet-700 bg-clip-text text-transparent">
                  VCA – Confidential
                </span>
                <Badge variant="outline" className="ml-2 gap-1 border-emerald-200 bg-white/70 align-middle text-[10px] text-emerald-700 shadow-sm">
                  <Sparkles className="h-3 w-3" /> Caseplans · Referrals · Services
                </Badge>
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {String(vca.vca_gender || vca.gender || "N/A")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {age} years
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {String(vca.ward || vca.district || "N/A")}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="group inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur-md transition-all hover:border-emerald-300 hover:bg-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            </div>
          </div>
        </div>

        {/* ── Quick stat cards ──────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(() => {
            const hhId = vca.household_id || vca.household_code || vca.householdid || vca.hh_id;
            const cards = [
              {
                icon: Link2,
                label: "Household ID",
                value: String(hhId || "N/A"),
                iconBg: "from-emerald-100 to-teal-100 text-emerald-700",
                glow: "from-emerald-200/70 via-teal-200/40",
                onClick: hhId ? () => navigate(`/profile/household-details`, { state: { id: String(hhId) } }) : undefined,
              },
              {
                icon: HeartPulse,
                label: "Facility",
                value: String(vca.facility || "N/A"),
                iconBg: "from-rose-100 to-pink-100 text-rose-700",
                glow: "from-rose-200/70 via-pink-200/40",
                onClick: undefined as undefined | (() => void),
              },
              {
                icon: ClipboardCheck,
                label: "Last service date",
                value: String(lastServiceDate),
                iconBg: "from-sky-100 to-cyan-100 text-sky-700",
                glow: "from-sky-200/70 via-cyan-200/40",
                onClick: undefined as undefined | (() => void),
              },
            ];
            return cards.map((card) => {
              const Icon = card.icon;
              const Wrapper = card.onClick ? "button" : "div";
              return (
                <Wrapper
                  key={card.label}
                  onClick={card.onClick}
                  className={cn("group relative text-left", card.onClick && "cursor-pointer")}
                  type={card.onClick ? "button" : undefined}
                >
                  <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br ${card.glow} to-transparent opacity-40 blur-md transition-opacity duration-500 group-hover:opacity-100`} />
                  <div className="relative h-full w-full rounded-2xl border border-slate-200/70 bg-white/75 p-5 backdrop-blur-xl shadow-[0_15px_40px_-25px_rgba(15,23,42,0.35)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-slate-300">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.iconBg} ring-1 ring-white/60 shadow-sm`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-3 text-base font-extrabold text-slate-900 truncate" title={card.value}>{card.value}</div>
                    <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{card.label}</div>
                  </div>
                </Wrapper>
              );
            });
          })()}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <div className="-mx-1 overflow-x-auto px-1 max-w-full">
              <TabsList className="inline-flex h-9 items-center gap-1 rounded-xl bg-slate-100/80 p-1 backdrop-blur-sm border border-slate-200/50 whitespace-nowrap">
                <TabsTrigger value="overview" className="h-7 px-4 rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                  Summary
                </TabsTrigger>
                <TabsTrigger value="history" className="h-7 px-4 rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                  Caseplans
                </TabsTrigger>
                <TabsTrigger value="audit" className="h-7 px-4 rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                  Referrals
                </TabsTrigger>
                <TabsTrigger value="flags" className="h-7 px-4 rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                  Flag form
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="hidden text-xs font-bold text-slate-400 md:block">
              VCA ID: <span className="text-slate-900">{id}</span>
            </div>
          </div>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="h-full border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                      <Baby className="h-5 w-5 text-slate-600" /> Profile demographics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6 sm:grid-cols-2">
                    {/* Personal info (legal name, address, phone, NRC) intentionally
                        omitted per data-minimisation policy. Only structural attributes remain. */}
                    <InfoItem label="Date of birth" value={String(vca.birthdate || "N/A")} icon={<Calendar className="h-3.5 w-3.5" />} />
                    <InfoItem label="Gender identity" value={String(vca.vca_gender || vca.gender || "N/A")} />
                    <InfoItem label="Age at assessment" value={`${age} Years`} />
                    <InfoItem label="Geographic ward" value={String(vca.ward || "N/A")} />
                    <InfoItem label="Province jurisdiction" value={String(vca.province || "N/A")} />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                      <ClipboardCheck className="h-5 w-5 text-slate-600" /> Sub populations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {(() => {
                      const isTrue = (v: any) => v === "1" || v === "true" || v === 1 || v === true || String(v).toLowerCase() === "yes";
                      const pbfwFlag   = isTrue((vca as any).pbfw) || isTrue((vca as any).agyw);
                      const hivPos     = isTrue((vca as any).is_hiv_positive) || isTrue((vca as any).calhiv);
                      const motherPbfw = isTrue((vca as any).is_biological_mother_of_child_living_with_hiv)
                        || isTrue((vca as any).mother_pbfw)
                        || isTrue((vca as any).caregiver_pbfw);

                      const generic = Object.entries(vca)
                        .filter(([key, value]) => isTrue(value) && subPopulationFilterLabels[key])
                        .map(([key]) => subPopulationFilterLabels[key]);

                      const derived: string[] = [];
                      if (pbfwFlag && hivPos)  derived.push("HIV+ PBFW");
                      if (pbfwFlag && !hivPos) derived.push("HIV- PBFW");
                      if (motherPbfw)          derived.push("Children of PBFW");

                      const all = [...generic, ...derived];
                      if (all.length === 0) {
                        return (
                          <div className="w-full flex flex-col items-center justify-center py-6 text-center text-slate-400">
                            <ClipboardCheck className="h-8 w-8 opacity-10 mb-2" />
                            <p className="text-xs font-bold tracking-widest">No sub populations</p>
                          </div>
                        );
                      }
                      return all.map((label) => (
                        <Badge
                          key={label}
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 font-black text-[10px] tracking-wider"
                        >
                          {label}
                        </Badge>
                      ));
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0 w-full overflow-hidden min-w-0">
            <Card className="border-slate-200 min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Caseplans</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCasePlans ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingDots />
                  </div>
                ) : vcaCasePlans.length > 0 ? (
                  <div className="w-full overflow-x-auto">
                    <Table className="table-fixed w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Date</TableHead>
                          <TableHead className="w-[120px]">Status</TableHead>
                          <TableHead className="w-[150px]">Created at</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedCasePlans.map((plan: any, idx: number) => (
                          <CasePlanRow key={idx} plan={plan} servicesSource={sortedVcaServices} />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <EmptyState icon={<FileText className="h-7 w-7" />} title="No caseplans recorded" description="No case plans have been created for this VCA yet." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-0 w-full overflow-hidden">
            <Card className="overflow-hidden border-slate-200">
              <div className="bg-white p-6 flex items-center justify-between border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">Referrals</h3>
                <Button variant="outline" size="sm" className="text-xs font-bold">Export</Button>
              </div>
              <ScrollArea className="h-[500px]">
                <ActivityTable data={sortedReferrals} isLoading={isLoadingReferrals} type="referral" emptyMessage="No referral tracking for this VCA." />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="flags" className="mt-0 w-full overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="space-y-6">
              <Card className="overflow-hidden border-slate-200 border-none shadow-none bg-transparent">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-slate-900">Data quality flags</h3>
                </div>

                {vcaFlags.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <p className="text-[10px] font-black tracking-widest text-orange-500 uppercase">Active attention required</p>
                    {vcaFlags.map((flag: any) => (
                      <div key={flag.id} className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-xl shadow-sm border border-orange-100 flex-shrink-0">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{toTitleCase(flag.comment || "Suspicious data entry")}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Flagged by {flag.verifier} • {format(new Date(flag.date_created), "MMM d, yyyy")}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleResolve(flag.id)}
                          disabled={resolveMutation.isPending}
                          size="sm"
                          variant="ghost"
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] rounded-lg h-8 px-3 transition-all"
                        >
                          Resolve
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Card className="border-slate-200 shadow-sm overflow-hidden bg-slate-50/50">
                  <div className="p-6 border-b border-slate-100 bg-white/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Flag className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900">Record new flag</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest"></p>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onFlagSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Flag category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 text-sm font-medium">
                                      <SelectValue placeholder="Choose category...(optional)" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                    <SelectItem value="Missing Data">Missing data</SelectItem>
                                    <SelectItem value="Invalid Data">Invalid data</SelectItem>
                                    <SelectItem value="Duplicate Record">Duplicate record</SelectItem>
                                    <SelectItem value="Incorrect Service">Incorrect service logging</SelectItem>
                                    <SelectItem value="Case Plan Mismatch">Case plan mismatch</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="severity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Priority severity</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 text-sm font-medium">
                                      <SelectValue placeholder="Select severity... (optional)" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                    <SelectItem value="Low">Low severity</SelectItem>
                                    <SelectItem value="Medium">Medium severity</SelectItem>
                                    <SelectItem value="High">High severity</SelectItem>
                                    <SelectItem value="Critical">Critical issue</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="comment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Flag observations & action details</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Provide detailed observations about the data quality issue, any suspected causes, and recommended immediate actions..."
                                  className="min-h-[120px] bg-white border-slate-200 rounded-xl focus-visible:ring-emerald-500/20 text-sm italic font-medium"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                          <div className="flex items-center gap-2 text-slate-400">
                            <AlertCircle className="h-3 w-3" />
                            <p className="text-[10px] font-medium">Submitted flags will be reviewed by district monitors within 24 hours.</p>
                          </div>
                          <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="bg-slate-900 border-none hover:bg-slate-800 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-95 whitespace-nowrap">
                            {mutation.isPending ? (
                              <>
                                <LoadingDots className="h-4" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Submit flag record
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </Card>

              <Card className="overflow-hidden border-slate-200 shadow-sm">
                <div className="p-6 flex items-center justify-between border-b bg-rose-50/50 border-rose-100">
                  <h3 className="text-lg font-bold text-rose-900">Flagging history</h3>
                  <Badge variant="outline" className="bg-white border-rose-200 text-rose-700 font-black text-[10px]">
                    {vcaFlags.length} records
                  </Badge>
                </div>
                <CardContent className="p-0">
                  {vcaFlags.length > 0 ? (
                    <div className="w-full overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-sky-50/40">
                          <TableRow>
                            <TableHead className="pl-6 font-bold text-[10px] text-slate-400 uppercase tracking-widest">Category</TableHead>
                            <TableHead className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Date flagged</TableHead>
                            <TableHead className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Observations</TableHead>
                            <TableHead className="text-right pr-6 font-bold text-[10px] text-slate-400 uppercase tracking-widest">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vcaFlags.map((item: any, idx: number) => (
                            <TableRow key={idx} className="transition-colors border-b border-emerald-50/60 hover:bg-gradient-to-r hover:from-emerald-50/40 hover:via-teal-50/20 hover:to-transparent">
                              <TableCell className="pl-6">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 text-sm">{String(item.category || item.form_type || "General")}</span>
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-tighter",
                                    item.severity === "Critical" ? "text-red-600" : "text-slate-400"
                                  )}>
                                    {item.severity || "Normal"} priority
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                                {String(item.date_created || item.created_at || "N/A") && format(new Date(item.date_created || item.created_at), "dd MMM yyyy") || "N/A"}
                              </TableCell>
                              <TableCell className="text-xs text-slate-600 max-w-md italic leading-relaxed">
                                {String(item.comment || item.description || item.reason || "No description provided")}
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <Badge variant="outline" className="text-[9px] font-black text-rose-600 border-rose-100 bg-rose-50 px-2 rounded-md uppercase tracking-tighter">
                                  Flagged
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <EmptyState icon={<ClipboardCheck className="h-7 w-7" />} title="No flagged records" description="This child has no documented data quality issues." />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const ActivityTable = ({ data, isLoading, type, emptyMessage }: { data: any[], isLoading: boolean, type: 'service' | 'case-plan' | 'referral', emptyMessage: string }) => {
  if (isLoading) return <div className="p-20 text-center"><LoadingDots /></div>;
  if (data.length === 0) return (
    <div className="p-20 text-center text-slate-400">
      <p className="font-bold text-xs tracking-widest">{emptyMessage}</p>
    </div>
  );

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader className="bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-sky-50/40">
          <TableRow>
            <TableHead className="pl-6">Record Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="pr-6">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell className="pl-6 font-bold text-slate-900">
                {String(item.service || item.service_name || item.form_name || item.referral_type || "N/A")}
              </TableCell>
              <TableCell className="text-sm">
                {String(item.service_date || item.visit_date || item.date || "N/A")}
              </TableCell>
              <TableCell className="pr-6">
                <Badge variant="outline" className="text-[10px] font-bold text-primary">
                  {String(item.status || item.state || "N/A")}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const InfoItem = ({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) => (
  <div className="space-y-1 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{label}</p>
    <div className="flex items-center gap-2">
      {icon && <span className="text-slate-400">{icon}</span>}
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);

const cleanArrayString = (str: string | null | undefined) => {
  if (!str) return "-";
  try {
    return String(str).replace(/[\[\]"]/g, "").replace(/,/g, ", ");
  } catch (e) {
    return String(str);
  }
};

const CasePlanRow = ({ plan, servicesSource = [] }: { plan: any; servicesSource?: any[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  const [tableWidth, setTableWidth] = useState(0);

  let linkedServices = servicesSource.filter((s) => {
    const serviceLinkId = String(s.case_plan_id || s.vcaid || s.caseplan_id || "");
    const planId = String(plan.case_plan_id || plan.unique_id || plan.id || "");
    return serviceLinkId && planId && serviceLinkId === planId;
  });

  const isFallback = linkedServices.length === 0 && servicesSource.length > 0;
  if (isFallback) {
    linkedServices = servicesSource;
  }

  useEffect(() => {
    if (!isOpen) return;

    let isSyncing = false;

    const timer = setTimeout(() => {
      const top = topScrollRef.current;
      const bottom = bottomScrollRef.current;
      if (!top || !bottom) return;

      // Update dummy width to match real table content
      const realWidth = bottom.scrollWidth;
      setTableWidth(realWidth);

      bottom.scrollLeft = top.scrollLeft;

      const handleTopScroll = () => {
        if (isSyncing) return;
        isSyncing = true;
        bottom.scrollLeft = top.scrollLeft;
        requestAnimationFrame(() => { isSyncing = false; });
      };

      const handleBottomScroll = () => {
        if (isSyncing) return;
        isSyncing = true;
        top.scrollLeft = bottom.scrollLeft;
        requestAnimationFrame(() => { isSyncing = false; });
      };

      top.addEventListener("scroll", handleTopScroll, { passive: true });
      bottom.addEventListener("scroll", handleBottomScroll, { passive: true });

      return () => {
        top.removeEventListener("scroll", handleTopScroll);
        bottom.removeEventListener("scroll", handleBottomScroll);
      };
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, linkedServices.length]);

  return (
    <>
      <TableRow className={cn(isOpen ? "bg-slate-50 border-b-0" : "")}>
        <TableCell className="text-sm font-medium">
          {plan.case_plan_date ||
            plan.date_of_caseplan ||
            plan.case_plan?.date_of_caseplan ||
            plan.case_plan?.date ||
            plan.date ||
            "N/A"}
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="text-[10px] font-bold tracking-wider">
            {plan.case_plan_status ||
              plan.status ||
              plan.case_plan?.status ||
              plan.case_plan?.state ||
              "Initial"}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-slate-500">
          {plan.date_created || plan.created_at || plan.case_plan?.created_at
            ? new Date(plan.date_created || plan.created_at || plan.case_plan?.created_at).toLocaleDateString()
            : "N/A"}
        </TableCell>
        <TableCell className="text-right">
          <Button
            variant={isOpen ? "secondary" : "outline"}
            size="sm"
            className="h-8 text-xs font-bold"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "Hide Services" : "View Services"}
          </Button>
        </TableCell>
      </TableRow>
      {isOpen && (
        <TableRow className="bg-slate-50 hover:bg-slate-50 border-b-0">
          <TableCell colSpan={4} className="p-2 md:p-4 pt-0 overflow-hidden" style={{ maxWidth: "1px", width: "100%" }}>
            <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden flex flex-col w-full min-w-0">
              <div className="bg-slate-100 px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 flex justify-between items-center">
                <h4 className="text-sm md:text-lg font-black tracking-wider text-slate-700">Vulnerabilities</h4>
                {isFallback && (
                  <span className="text-[10px] md:text-sm text-amber-600 font-bold bg-amber-50 px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-amber-200 shadow-sm">
                    Showing all vca services
                  </span>
                )}
              </div>
              {linkedServices.length > 0 ? (
                <div className="w-full relative overflow-hidden">
                  <div
                    ref={topScrollRef}
                    className="w-full overflow-x-auto overflow-y-hidden h-6 bg-slate-50 border-b border-slate-200 scrollbar-thin shadow-inner z-10"
                  >
                    <div style={{ width: tableWidth || '1200px' }} className="h-px" />
                  </div>
                  <div ref={bottomScrollRef} className="w-full overflow-x-auto no-scrollbar">
                    <Table className="min-w-[1200px] table-fixed">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent bg-slate-50/50">
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 w-32 md:w-40 border-r border-slate-100">
                            Service Date
                          </TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 border-r border-slate-100">
                            Health Services
                          </TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 border-r border-slate-100">
                            HIV Services
                          </TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 border-r border-slate-100">
                            Other Health
                          </TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 border-r border-slate-100">
                            Safe
                          </TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 border-r border-slate-100">
                            School Services
                          </TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900">
                            Stable
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {linkedServices.map((svc: any, i: number) => (
                          <TableRow key={i} className="transition-colors border-b border-emerald-50/60 hover:bg-gradient-to-r hover:from-emerald-50/40 hover:via-teal-50/20 hover:to-transparent">
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 font-bold text-slate-900 border-r border-slate-100">
                              {svc.service_date || "N/A"}
                            </TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 whitespace-normal text-slate-700 leading-relaxed border-r border-slate-100">
                              {cleanArrayString(svc.health_services)}
                            </TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 whitespace-normal text-slate-700 leading-relaxed border-r border-slate-100">
                              {cleanArrayString(svc.hiv_services)}
                            </TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 whitespace-normal text-slate-700 leading-relaxed border-r border-slate-100">
                              {cleanArrayString(svc.other_health_services)}
                            </TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 whitespace-normal text-slate-700 leading-relaxed border-r border-slate-100">
                              {cleanArrayString(svc.safe_services)}
                            </TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 whitespace-normal text-slate-700 leading-relaxed border-r border-slate-100">
                              {cleanArrayString(svc.schooled_services)}
                            </TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 whitespace-normal text-slate-700 leading-relaxed">
                              {cleanArrayString(svc.stable_services)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-[10px] md:text-xs italic font-bold tracking-widest">
                  No detailed services found.
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default VcaProfile;
