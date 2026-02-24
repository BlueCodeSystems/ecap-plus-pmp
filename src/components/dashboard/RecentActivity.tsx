import { useState, useMemo } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GlowCard from "@/components/aceternity/GlowCard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, HeartPulse, Flag, ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_DISTRICT,
  getVcaServicesByDistrict,
  getCaregiverServicesByDistrict,
  getFlaggedRecords,
} from "@/lib/api";

type FeedItem = {
  type: "vca-service" | "caregiver-service" | "flag";
  id: string;
  title: string;
  subtitle: string;
  date: string;
  status: string;
  linkId?: string;
};

const pickValue = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return String(value);
    }
  }
  return "N/A";
};

const parseDate = (raw: string): Date => {
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

const formatDate = (raw: string): string => {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const tabs = [
  { key: "all", label: "All" },
  { key: "vca-service", label: "VCA Services" },
  { key: "caregiver-service", label: "Caregiver" },
  { key: "flag", label: "Flags" },
] as const;

const typeConfig = {
  "vca-service": {
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
    badge: "bg-blue-50 text-blue-700",
    route: "/vca-services",
  },
  "caregiver-service": {
    icon: HeartPulse,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    badge: "bg-emerald-50 text-emerald-700",
    route: "/household-services",
  },
  flag: {
    icon: Flag,
    color: "text-amber-600",
    bg: "bg-amber-50",
    badge: "bg-amber-50 text-amber-700",
    route: "/flags",
  },
};

const FEED_LIMIT = 15;

const RecentActivity = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const flagsQuery = useQuery({
    queryKey: ["recent-flags"],
    queryFn: getFlaggedRecords,
  });

  const isLoading = flagsQuery.isLoading;

  const feed = useMemo(() => {
    const items: FeedItem[] = [];

    // Flags
    for (const raw of flagsQuery.data ?? []) {
      const record = raw as Record<string, unknown>;
      items.push({
        type: "flag",
        id: pickValue(record, ["id"]),
        title: pickValue(record, ["comment", "reason"]),
        subtitle: `HH ${pickValue(record, ["household_id"])} - ${pickValue(record, ["caregiver_name"])}`,
        date: pickValue(record, ["date_created"]),
        status: pickValue(record, ["status"]),
        linkId: pickValue(record, ["household_id"]),
      });
    }

    // Sort by date descending
    items.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());

    return items;
  }, [flagsQuery.data]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return feed.slice(0, FEED_LIMIT);
    const q = searchQuery.toLowerCase();
    return feed.filter(item =>
      item.id.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q)
    ).slice(0, FEED_LIMIT);
  }, [feed, searchQuery]);

  return (
    <GlowCard>
      <CardHeader className="pb-3 border-b border-slate-50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Flag className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg font-black">Flagged Records</CardTitle>
            </div>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Review records requiring clinical or administrative attention
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filter flags..."
              className="pl-9 h-9 bg-slate-50 border-none text-xs font-bold focus-visible:ring-amber-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {isLoading ? (
          <TableSkeleton rows={5} columns={2} />
        ) : filtered.length === 0 ? (
          <div className="flex h-[380px] flex-col items-center justify-center text-sm text-slate-400">
            <div className="p-6 rounded-full bg-slate-50 border border-slate-100 mb-4 opacity-40">
              <Flag className="h-10 w-10" />
            </div>
            <p className="font-black text-slate-500">No flags requiring attention</p>
            <p className="text-xs mt-1">Excellent! All records are clean.</p>
          </div>
        ) : (
          <ScrollArea className="h-[420px] pr-2">
            <div className="space-y-2">
              {filtered.map((item, i) => {
                const config = typeConfig.flag;
                const Icon = config.icon;

                return (
                  <div
                    key={`${item.id}-${i}`}
                    className="group flex items-start gap-4 rounded-xl p-4 transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer active:scale-[0.98]"
                    onClick={() => {
                      navigate(`/flags`);
                    }}
                  >
                    <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-[13px] font-black text-slate-900 leading-tight">
                          {item.title}
                        </p>
                        <span className="shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {formatDate(item.date)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-500 truncate">{item.subtitle}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="text-[9px] font-black px-2 py-0.5 h-auto bg-amber-50 text-amber-700 border-amber-100 uppercase tracking-widest">
                          {item.status || "Pending review"}
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          View details <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </GlowCard>
  );
};

export default RecentActivity;
