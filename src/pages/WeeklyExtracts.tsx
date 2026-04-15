import {
    Database,
    RefreshCw,
    Activity,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowRight,
    Server,
    Timer,
    Workflow,
    BarChart3,
    Play,
    RotateCcw,
    Download,
    FileSpreadsheet,
    XCircle,
    TestTubes,
    Mail,
    Smartphone,
    Building2,
} from "lucide-react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    triggerEtlPipeline,
    getEtlRuns,
    getEtlRunById,
    cancelEtlRun,
    getEtlPipelines,
    getEtlFiles,
    getEtlDownloadUrl,
    sendEtlReport,
    getTabletSyncStatus,
    getFacilityPerformance,
    type EtlRun,
    type EtlFile,
} from "@/lib/api";
import LoadingDots from "@/components/aceternity/LoadingDots";
import { cn } from "@/lib/utils";

const PIPELINE_META: Record<string, { icon: typeof Database; color: string; description: string }> = {
    ecap_plus: {
        icon: Database,
        color: "emerald",
        description: "Full monthly aggregation: extract from ECAP Plus, transform, generate reports, and export caregiver + VCA service CSVs.",
    },
    hts_register: {
        icon: TestTubes,
        color: "amber",
        description: "Extract HTS register data: HIV testing service records and index contact tracing from ECAP Plus.",
    },
};

const DataPipelinePage = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"pipelines" | "runs" | "facilities" | "tablets">("pipelines");
    const [runningPipelines, setRunningPipelines] = useState<Record<string, string>>({});
    const [selectedRun, setSelectedRun] = useState<EtlRun | null>(null);
    const [filesByPipeline, setFilesByPipeline] = useState<Record<string, EtlFile[]>>({});
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [tabletFilter, setTabletFilter] = useState<"all" | "active" | "stale" | "inactive">("all");

    const pipelinesQuery = useQuery({
        queryKey: ["etl", "pipelines"],
        queryFn: getEtlPipelines,
        staleTime: 60_000,
    });

    const runsQuery = useQuery({
        queryKey: ["etl", "runs"],
        queryFn: () => getEtlRuns({ limit: 30 }),
        refetchInterval: 10_000,
    });

    const tabletSyncQuery = useQuery({
        queryKey: ["etl", "tablet-sync"],
        queryFn: getTabletSyncStatus,
        staleTime: 60_000,
        refetchInterval: 15 * 60 * 1000, // auto-refresh every 15 minutes
    });
    const tabletSync = tabletSyncQuery.data;

    const facilityQuery = useQuery({
        queryKey: ["etl", "facilities"],
        queryFn: getFacilityPerformance,
        staleTime: 300_000,
    });

    const runs = runsQuery.data ?? [];
    const latestRun = runs[0];
    const successRuns = runs.filter((r) => r.status === "success");
    const failedRuns = runs.filter((r) => r.status === "failed");
    const runningRuns = runs.filter((r) => r.status === "running");

    useEffect(() => {
        const active: Record<string, string> = {};
        for (const r of runningRuns) {
            active[r.pipeline] = r.run_id;
        }
        setRunningPipelines(active);
    }, [runningRuns.length]);

    const loadFiles = useCallback(async () => {
        const keys = ["ecap_plus", "hts_register"];
        const results: Record<string, EtlFile[]> = {};
        for (const key of keys) {
            try {
                results[key] = await getEtlFiles(key);
            } catch {
                results[key] = [];
            }
        }
        setFilesByPipeline(results);
    }, []);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    useEffect(() => {
        if (latestRun && (latestRun.status === "success" || latestRun.status === "failed")) {
            loadFiles();
        }
    }, [latestRun?.status, latestRun?.run_id, loadFiles]);

    const handleTrigger = async (pipelineKey: string) => {
        try {
            const run = await triggerEtlPipeline(pipelineKey);
            toast.success(`Pipeline started: ${run.pipeline_name}`, { description: `Run ID: ${run.run_id}` });
            queryClient.invalidateQueries({ queryKey: ["etl", "runs"] });
        } catch (err: any) {
            toast.error("Failed to start pipeline", { description: err.message });
        }
    };

    const handleCancel = async (runId: string) => {
        try {
            await cancelEtlRun(runId);
            toast.info(`Run ${runId} cancelled`);
            queryClient.invalidateQueries({ queryKey: ["etl", "runs"] });
        } catch (err: any) {
            toast.error("Failed to cancel", { description: err.message });
        }
    };

    const handleViewLogs = async (runId: string) => {
        try {
            const run = await getEtlRunById(runId);
            setSelectedRun(run);
        } catch {
            toast.error("Failed to load run details");
        }
    };

    // Auto-poll logs every 3s when viewing a running pipeline
    useEffect(() => {
        if (!selectedRun || (selectedRun.status !== "running" && selectedRun.status !== "pending")) return;
        const interval = setInterval(async () => {
            try {
                const updated = await getEtlRunById(selectedRun.run_id);
                setSelectedRun(updated);
            } catch { /* ignore */ }
        }, 3000);
        return () => clearInterval(interval);
    }, [selectedRun?.run_id, selectedRun?.status]);

    const handleDownload = (pipeline: string, fileName: string) => {
        const url = getEtlDownloadUrl(pipeline, fileName);
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener";
        a.click();
    };

    const handleSendEmail = async () => {
        setIsSendingEmail(true);
        try {
            const data = await sendEtlReport();
            toast.success(data?.message || "Email report sent to the team");
        } catch (err: any) {
            toast.error("Failed to send email", { description: err.message });
        } finally {
            setIsSendingEmail(false);
        }
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return "-";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        });
    };

    const statusConfig: Record<string, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
        success: { color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
        running: { color: "text-blue-600", bg: "bg-blue-50", icon: RefreshCw },
        pending: { color: "text-slate-500", bg: "bg-slate-50", icon: Clock },
        failed: { color: "text-red-600", bg: "bg-red-50", icon: XCircle },
        cancelled: { color: "text-amber-600", bg: "bg-amber-50", icon: AlertCircle },
    };

    return (
        <DashboardLayout subtitle="Data Pipeline">
            <PageIntro
                eyebrow="ETL Infrastructure"
                title="Data Pipeline."
                description="Run and monitor the Extract, Transform, and Load processes. Trigger pipelines, download output CSVs, and track run history."
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleSendEmail}
                            disabled={isSendingEmail}
                            className="border-slate-200 bg-white hover:bg-slate-50"
                        >
                            {isSendingEmail ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                            Send Email Report
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => { queryClient.invalidateQueries(); loadFiles(); toast.info("Refreshed"); }}
                            className="border-slate-200 bg-white hover:bg-slate-50"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                }
            />

            {/* Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <GlowCard wrapperClassName="h-full" className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Running Now</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", runningRuns.length > 0 ? "text-blue-600" : "text-emerald-600")}>
                            {runningRuns.length > 0 ? `${runningRuns.length} Active` : "Idle"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {runningRuns.length > 0 ? runningRuns.map((r) => r.pipeline_name).join(", ") : "No pipelines running"}
                        </p>
                    </CardContent>
                </GlowCard>

                <GlowCard wrapperClassName="h-full" className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Last Run</CardTitle>
                        <Clock className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {latestRun ? formatDate(latestRun.started_at).split(",")[0] : "No runs yet"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {latestRun ? `${latestRun.pipeline_name} - ${formatDuration(latestRun.duration_sec)}` : "-"}
                        </p>
                    </CardContent>
                </GlowCard>

                <GlowCard wrapperClassName="h-full" className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Run History</CardTitle>
                        <BarChart3 className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{runs.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total recorded runs</p>
                        <div className="mt-3 flex items-center gap-3 text-[10px]">
                            <span className="text-emerald-600 font-medium">{successRuns.length} passed</span>
                            <span className="text-red-500 font-medium">{failedRuns.length} failed</span>
                        </div>
                    </CardContent>
                </GlowCard>

                <GlowCard wrapperClassName="h-full" className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pipelines</CardTitle>
                        <Server className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">2</div>
                        <p className="text-xs text-muted-foreground mt-1">ECAP Plus + HTS Register</p>
                    </CardContent>
                </GlowCard>

                <GlowCard wrapperClassName="h-full" className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tablet Sync</CardTitle>
                        <Smartphone className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {tabletSync ? `${tabletSync.active_7d}/${tabletSync.total}` : <LoadingDots />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Active in last 7 days</p>
                        {tabletSync && tabletSync.stale > 0 && (
                            <p className="text-xs text-orange-600 font-medium mt-3">{tabletSync.stale} stale ({'>'}30 days)</p>
                        )}
                    </CardContent>
                </GlowCard>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 bg-slate-100 rounded-2xl w-fit">
                {[
                    { id: "pipelines" as const, label: "Pipelines", icon: Workflow },
                    { id: "runs" as const, label: "Run History", icon: Timer },
                    { id: "facilities" as const, label: "Facility Performance", icon: Building2 },
                    { id: "tablets" as const, label: "Tablet Sync", icon: Smartphone },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSelectedRun(null); }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                            activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                        {tab.id === "runs" && runningRuns.length > 0 && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        )}
                    </button>
                ))}
            </div>

            {/* Pipelines Tab */}
            {activeTab === "pipelines" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {["ecap_plus", "hts_register"].map((key) => {
                        const meta = PIPELINE_META[key];
                        const Icon = meta.icon;
                        const isRunning = !!runningPipelines[key];
                        const runId = runningPipelines[key];
                        const files = filesByPipeline[key] ?? [];
                        const lastPipelineRun = runs.find((r) => r.pipeline === key);
                        const pipelineInfo = pipelinesQuery.data?.find((p) => p.id === key);

                        return (
                            <GlowCard key={key} wrapperClassName="h-full" className="h-full">
                                <div className="flex flex-col h-full">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-2xl" style={{
                                            backgroundColor: meta.color === "emerald" ? "#ecfdf5" : "#fffbeb",
                                            color: meta.color === "emerald" ? "#059669" : "#d97706",
                                        }}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{pipelineInfo?.name ?? key}</CardTitle>
                                            {isRunning && (
                                                <Badge className="bg-blue-50 text-blue-700 text-[10px] mt-1 gap-1">
                                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                                    Running ({runId})
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1 flex flex-col">
                                    <p className="text-xs text-slate-500 leading-relaxed">{meta.description}</p>

                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                                        {lastPipelineRun ? (<>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Last Run</span>
                                                <Badge variant="secondary" className={cn("text-[10px] h-4",
                                                    (statusConfig[lastPipelineRun.status] ?? statusConfig.pending).bg,
                                                    (statusConfig[lastPipelineRun.status] ?? statusConfig.pending).color,
                                                )}>{lastPipelineRun.status}</Badge>
                                            </div>
                                            <p className="text-xs text-slate-600">{formatDate(lastPipelineRun.started_at)}</p>
                                            <p className="text-[10px] text-slate-400">Duration: {formatDuration(lastPipelineRun.duration_sec)} | By: {lastPipelineRun.triggered_by}</p>
                                        </>) : (
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Last Run</span>
                                                <span className="text-xs text-slate-400">No runs yet</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2 flex-1">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Output Files</span>
                                        {files.length > 0 ? files.map((f) => (
                                            <div key={f.name} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FileSpreadsheet className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-slate-700 truncate">{f.name}</p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {f.exists ? `${f.sizeFormatted} | ${formatDate(f.lastModified)}` : "Not generated yet"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" className="h-7 px-2 text-primary hover:bg-primary/5"
                                                    disabled={!f.exists} onClick={() => handleDownload(key, f.name)}>
                                                    <Download className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )) : (
                                            <p className="text-xs text-slate-400">Run the pipeline to generate files</p>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-2 mt-auto">
                                        {isRunning ? (
                                            <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                                onClick={() => handleCancel(runId)}>
                                                <XCircle className="h-4 w-4 mr-2" /> Cancel Run
                                            </Button>
                                        ) : (
                                            <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                                onClick={() => handleTrigger(key)}>
                                                <Play className="h-4 w-4 mr-2" /> Run Pipeline
                                            </Button>
                                        )}
                                        {lastPipelineRun && (
                                            <Button size="sm" variant="outline" className="border-slate-200"
                                                onClick={() => { handleViewLogs(lastPipelineRun.run_id); setActiveTab("runs"); }}>
                                                View Logs
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                                </div>
                            </GlowCard>
                        );
                    })}
                </div>
            )}

            {/* Runs Tab */}
            {activeTab === "runs" && !selectedRun && (
                <GlowCard >
                    <CardHeader className="border-b border-slate-50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Timer className="h-5 w-5 text-primary" /> Pipeline Run History
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">{runs.length} runs</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {runs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <Workflow className="h-10 w-10 mb-3 text-slate-200" />
                                <p className="font-medium">No pipeline runs yet</p>
                                <p className="text-xs mt-1">Trigger a pipeline from the Pipelines tab to get started.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                                            <th className="px-6 py-4">Run ID</th>
                                            <th className="px-6 py-4">Pipeline</th>
                                            <th className="px-6 py-4">Started</th>
                                            <th className="px-6 py-4">Duration</th>
                                            <th className="px-6 py-4">Triggered By</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {runs.map((run) => {
                                            const sc = statusConfig[run.status] ?? statusConfig.pending;
                                            const StatusIcon = sc.icon;
                                            return (
                                                <tr key={run.run_id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4"><span className="text-sm font-bold font-mono text-slate-700">{run.run_id}</span></td>
                                                    <td className="px-6 py-4"><span className="text-xs font-medium text-slate-600">{run.pipeline_name || run.pipeline}</span></td>
                                                    <td className="px-6 py-4"><div className="flex items-center gap-1.5 text-xs text-slate-500"><Clock className="h-3 w-3" />{formatDate(run.started_at)}</div></td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-medium text-slate-600 font-mono">
                                                            {run.status === "running" ? <span className="text-blue-600 flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> In progress</span> : formatDuration(run.duration_sec)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4"><span className="text-xs text-slate-500">{run.triggered_by}</span></td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="secondary" className={cn("text-[10px] gap-1", sc.bg, sc.color)}>
                                                            <StatusIcon className={cn("h-3 w-3", run.status === "running" && "animate-spin")} /> {run.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {run.status === "running" && (
                                                                <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:bg-red-50" onClick={() => handleCancel(run.run_id)}>
                                                                    <XCircle className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            <Button size="sm" variant="ghost" className="h-7 px-2 text-primary hover:bg-primary/5 font-semibold" onClick={() => handleViewLogs(run.run_id)}>
                                                                Logs <ArrowRight className="h-3 w-3 ml-1" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </GlowCard>
            )}

            {/* Log Viewer */}
            {activeTab === "runs" && selectedRun && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedRun(null)} className="text-slate-500">
                            <ArrowRight className="h-4 w-4 mr-1 rotate-180" /> Back to Runs
                        </Button>
                        <span className="font-mono font-bold text-slate-700">{selectedRun.run_id}</span>
                        <Badge variant="secondary" className={cn("text-[10px]",
                            (statusConfig[selectedRun.status] ?? statusConfig.pending).bg,
                            (statusConfig[selectedRun.status] ?? statusConfig.pending).color,
                        )}>{selectedRun.status}</Badge>
                        {selectedRun.status === "running" && (
                            <Button size="sm" variant="outline" className="ml-auto border-slate-200" onClick={() => handleViewLogs(selectedRun.run_id)}>
                                <RefreshCw className="h-3 w-3 mr-1" /> Refresh Logs
                            </Button>
                        )}
                    </div>
                    <GlowCard >
                        <CardHeader className="border-b border-slate-50">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div><span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Pipeline</span><span className="font-medium text-slate-700">{selectedRun.pipeline_name || selectedRun.pipeline}</span></div>
                                <div><span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Started</span><span className="font-medium text-slate-700">{formatDate(selectedRun.started_at)}</span></div>
                                <div><span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Duration</span><span className="font-medium text-slate-700">{formatDuration(selectedRun.duration_sec)}</span></div>
                                <div><span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Triggered By</span><span className="font-medium text-slate-700">{selectedRun.triggered_by}</span></div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {selectedRun.error && (
                                <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                                    <strong>Error:</strong> {selectedRun.error}
                                </div>
                            )}
                            <div className="p-6">
                                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-2">Output Logs</span>
                                <pre className="bg-slate-900 text-slate-200 rounded-xl p-4 text-xs font-mono overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
                                    {selectedRun.logs || "(no output yet)"}
                                </pre>
                            </div>
                        </CardContent>
                    </GlowCard>
                </div>
            )}

            {/* ── Facilities Tab ── */}
            {activeTab === "facilities" && (
                <GlowCard>
                    <CardHeader className="border-b border-slate-50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Health Facility Performance
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                                {facilityQuery.data?.length ?? 0} facilities
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                                        <th className="px-6 py-4">Facility</th>
                                        <th className="px-6 py-4">District</th>
                                        <th className="px-6 py-4">VCAs</th>
                                        <th className="px-6 py-4">Households</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(facilityQuery.data ?? []).map((f, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3 text-sm font-medium text-slate-700">{f.facility}</td>
                                            <td className="px-6 py-3 text-xs text-slate-500">{f.district}</td>
                                            <td className="px-6 py-3 text-sm font-mono text-slate-600">{Number(f.total_vcas).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-sm font-mono text-slate-600">{Number(f.households).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </GlowCard>
            )}

            {/* ── Tablet Sync Tab ── */}
            {activeTab === "tablets" && (() => {
                const filtered = tabletSync?.providers.filter(p => tabletFilter === "all" || p.status === tabletFilter) ?? [];
                const exportCsv = () => {
                    const rows = filtered.map(p => [
                        p.provider,
                        p.last_activity ? new Date(p.last_activity).toLocaleString("en-GB") : "",
                        String(p.total_events),
                        p.status,
                    ]);
                    const header = "Provider,Last Activity,Events,Status\n";
                    const csv = header + rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `tablet_sync_${tabletFilter}_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                };

                return (
                <GlowCard>
                    <CardHeader className="border-b border-slate-50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="h-5 w-5 text-primary" />
                                Tablet / Provider Sync Status
                            </CardTitle>
                            <div className="flex items-center gap-2 flex-wrap">
                                {tabletSync && (
                                    <>
                                        <button onClick={() => setTabletFilter(tabletFilter === "all" ? "all" : "all")}
                                            className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border",
                                                tabletFilter === "all" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                            )}>
                                            All ({tabletSync.total})
                                        </button>
                                        <button onClick={() => setTabletFilter(tabletFilter === "active" ? "all" : "active")}
                                            className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border",
                                                tabletFilter === "active" ? "bg-emerald-600 text-white border-emerald-600" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400"
                                            )}>
                                            Active ({tabletSync.active_7d})
                                        </button>
                                        <button onClick={() => setTabletFilter(tabletFilter === "stale" ? "all" : "stale")}
                                            className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border",
                                                tabletFilter === "stale" ? "bg-amber-600 text-white border-amber-600" : "bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400"
                                            )}>
                                            Stale ({tabletSync.active_30d - tabletSync.active_7d})
                                        </button>
                                        <button onClick={() => setTabletFilter(tabletFilter === "inactive" ? "all" : "inactive")}
                                            className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border",
                                                tabletFilter === "inactive" ? "bg-red-600 text-white border-red-600" : "bg-red-50 text-red-700 border-red-200 hover:border-red-400"
                                            )}>
                                            Inactive ({tabletSync.total - tabletSync.active_30d})
                                        </button>
                                    </>
                                )}
                                <Button variant="outline" size="sm" className="border-slate-200 text-xs ml-1"
                                    onClick={() => { queryClient.invalidateQueries({ queryKey: ["etl", "tablet-sync"] }); toast.info("Refreshing tablet sync data..."); }}
                                    disabled={tabletSyncQuery.isFetching}
                                >
                                    <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", tabletSyncQuery.isFetching && "animate-spin")} />
                                    Sync Now
                                </Button>
                                <Button variant="outline" size="sm" className="border-slate-200 text-xs" onClick={exportCsv} disabled={filtered.length === 0}>
                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="mx-6 mt-4 flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>This data auto-syncs every <strong>15 minutes</strong> from the source database. Use <strong>Sync Now</strong> to refresh immediately.
                        {tabletSyncQuery.dataUpdatedAt > 0 && (
                            <> Last synced: <strong>{new Date(tabletSyncQuery.dataUpdatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</strong></>
                        )}
                        </span>
                    </div>
                    <CardContent className="p-0">
                        {!tabletSync ? (
                            <div className="flex justify-center py-16"><LoadingDots /></div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <Smartphone className="h-10 w-10 mb-3 text-slate-200" />
                                <p className="font-medium">No providers match this filter</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                                            <th className="px-6 py-4">#</th>
                                            <th className="px-6 py-4">Provider</th>
                                            <th className="px-6 py-4">Last Activity</th>
                                            <th className="px-6 py-4">Events</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filtered.map((p, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-3 text-xs text-slate-400">{i + 1}</td>
                                                <td className="px-6 py-3">
                                                    <span className="text-sm font-medium text-slate-700">{p.provider}</span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(p.last_activity).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="text-sm font-mono text-slate-600">{p.total_events.toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <Badge variant="secondary" className={cn("text-[10px]",
                                                        p.status === "active" ? "bg-emerald-50 text-emerald-700" :
                                                        p.status === "stale" ? "bg-amber-50 text-amber-700" :
                                                        "bg-red-50 text-red-700"
                                                    )}>
                                                        {p.status === "active" ? "Active" : p.status === "stale" ? "Stale (7-30d)" : "Inactive (>30d)"}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </GlowCard>
                );
            })()}
        </DashboardLayout>
    );
};

export default DataPipelinePage;
