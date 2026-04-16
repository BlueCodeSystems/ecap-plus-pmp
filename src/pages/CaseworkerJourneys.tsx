import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Download, Filter, Navigation, CalendarIcon, Flame, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import { format } from "date-fns";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getCaseworkerJourneys, getCaseworkerList } from "@/lib/api";
import type { JourneyPoint } from "@/lib/api";

const ZAMBIA_CENTER: [number, number] = [-13.1339, 27.8493];
const DEFAULT_ZOOM = 6;

// Heatmap layer component (uses leaflet.heat via useMap)
function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const heat = (L as any).heatLayer(points, {
      radius: 20,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.2: "#3b82f6", 0.4: "#10b981", 0.6: "#f59e0b", 0.8: "#ef4444", 1.0: "#dc2626" },
    }).addTo(map);
    return () => { map.removeLayer(heat); };
  }, [map, points]);
  return null;
}

// Playback marker that moves along the path
function PlaybackMarker({ position, point }: { position: [number, number]; point: any }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(position, { animate: true, duration: 0.3 });
  }, [map, position]);

  return (
    <CircleMarker
      center={position}
      radius={10}
      pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 1, weight: 3 }}
    >
      <Popup>
        <div className="text-sm space-y-0.5">
          <p className="font-semibold text-red-600">Current Position</p>
          {point?.facility && <p className="text-blue-600 font-medium">{point.facility}</p>}
          <p className="text-slate-500">
            {point?.visit_date ? new Date(point.visit_date).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
          </p>
          <p className="text-slate-400 text-xs">{point?.form_type}</p>
        </div>
      </Popup>
    </CircleMarker>
  );
}

const CaseworkerJourneys = () => {
  const [selectedCaseworker, setSelectedCaseworker] = useState<string>("");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [appliedFilters, setAppliedFilters] = useState<{
    caseworker: string;
    from: string;
    to: string;
  }>({ caseworker: "", from: "", to: "" });

  // View mode: journey (default), heatmap, playback
  const [viewMode, setViewMode] = useState<"journey" | "heatmap" | "playback">("journey");

  // Playback state
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: caseworkerList = [] } = useQuery({
    queryKey: ["caseworker-list"],
    queryFn: getCaseworkerList,
    staleTime: 10 * 60 * 1000,
  });

  const hasCaseworker = appliedFilters.caseworker && appliedFilters.caseworker !== "all";
  const {
    data: journeyPoints = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["caseworker-journeys", appliedFilters],
    queryFn: () =>
      getCaseworkerJourneys({
        caseworker: appliedFilters.caseworker || undefined,
        from: appliedFilters.from || undefined,
        to: appliedFilters.to || undefined,
      }),
    staleTime: 5 * 60 * 1000,
    enabled: !!hasCaseworker,
  });

  const validPoints = useMemo(
    () => journeyPoints.filter((p) => p.lat !== null && p.lng !== null && !isNaN(Number(p.lat)) && !isNaN(Number(p.lng))),
    [journeyPoints]
  );

  const sortedPoints = useMemo(
    () => [...validPoints].sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()),
    [validPoints]
  );

  const polylinePositions = useMemo(
    () => sortedPoints.map((p) => [Number(p.lat), Number(p.lng)] as [number, number]),
    [sortedPoints]
  );

  const heatmapData = useMemo(
    () => validPoints.map((p) => [Number(p.lat), Number(p.lng), 0.5] as [number, number, number]),
    [validPoints]
  );

  const mapCenter = useMemo<[number, number]>(() => {
    if (polylinePositions.length > 0) return polylinePositions[0];
    return ZAMBIA_CENTER;
  }, [polylinePositions]);

  const mapZoom = polylinePositions.length > 0 ? 13 : DEFAULT_ZOOM;

  const dateRange = useMemo(() => {
    if (validPoints.length === 0) return null;
    const dates = validPoints.map((p) => p.visit_date).filter(Boolean).sort();
    return { from: dates[0], to: dates[dates.length - 1] };
  }, [validPoints]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      caseworker: selectedCaseworker,
      from: fromDate ? format(fromDate, "yyyy-MM-dd") : "",
      to: toDate ? format(toDate, "yyyy-MM-dd") : "",
    });
    setPlaybackIndex(0);
    setIsPlaying(false);
  };

  const handleExportCsv = () => {
    if (validPoints.length === 0) return;
    const headers = ["Caseworker", "Facility", "Visit Date", "Form Type", "Latitude", "Longitude"];
    const rows = validPoints.map((p: any) => [
      `"${p.caseworker}"`, `"${p.facility || ""}"`, `"${p.visit_date}"`, `"${p.form_type}"`, p.lat ?? "", p.lng ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `caseworker-journeys-${appliedFilters.caseworker}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Playback controls
  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playbackRef.current) clearInterval(playbackRef.current);
    } else {
      setIsPlaying(true);
      if (playbackIndex >= sortedPoints.length - 1) setPlaybackIndex(0);
    }
  }, [isPlaying, playbackIndex, sortedPoints.length]);

  useEffect(() => {
    if (isPlaying && sortedPoints.length > 0) {
      playbackRef.current = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= sortedPoints.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
    }
    return () => { if (playbackRef.current) clearInterval(playbackRef.current); };
  }, [isPlaying, sortedPoints.length]);

  const playbackPoint = sortedPoints[playbackIndex];
  const playbackPosition = playbackPoint ? [Number(playbackPoint.lat), Number(playbackPoint.lng)] as [number, number] : null;
  const playbackTrail = polylinePositions.slice(0, playbackIndex + 1);

  return (
    <DashboardLayout subtitle="Caseworker Journeys">
      <div className="space-y-6">
        <PageIntro
          eyebrow="Global Positioning System"
          title="Caseworker Journeys."
          description="Track and visualize caseworker field visits on a map. View movement patterns, visit locations, and GPS-tagged form submissions to monitor coverage and outreach."
        />

        {/* Filter Bar */}
        <GlowCard>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[200px] flex-1">
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Caseworker</label>
                <Select value={selectedCaseworker} onValueChange={setSelectedCaseworker}>
                  <SelectTrigger><SelectValue placeholder="Select Caseworker" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Caseworkers</SelectItem>
                    {caseworkerList.map((cw: any) => (
                      <SelectItem key={cw.caseworker} value={cw.caseworker}>
                        <span className="flex items-center gap-2">
                          {cw.display_name || cw.caseworker}
                          {cw.has_gps ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">Has GPS Data</span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-400">No GPS Data</span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-slate-500">From</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !fromDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "dd MMM yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="min-w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-slate-500">To</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !toDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "dd MMM yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={handleApplyFilters} className="gap-2">
                <Navigation className="h-4 w-4" /> Apply
              </Button>
              <Button variant="outline" onClick={handleExportCsv} disabled={validPoints.length === 0} className="gap-2">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </CardContent>
        </GlowCard>

        {/* Map Card */}
        <GlowCard>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Journey Map
              </CardTitle>
              {validPoints.length > 0 && (
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  <button onClick={() => { setViewMode("journey"); setIsPlaying(false); }}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      viewMode === "journey" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}>
                    <MapPin className="h-3 w-3 inline mr-1" /> Journey
                  </button>
                  <button onClick={() => { setViewMode("heatmap"); setIsPlaying(false); }}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      viewMode === "heatmap" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}>
                    <Flame className="h-3 w-3 inline mr-1" /> Heatmap
                  </button>
                  <button onClick={() => { setViewMode("playback"); setPlaybackIndex(0); setIsPlaying(false); }}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      viewMode === "playback" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}>
                    <Play className="h-3 w-3 inline mr-1" /> Playback
                  </button>
                </div>
              )}
            </div>
            {validPoints.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs">
                {appliedFilters.caseworker && appliedFilters.caseworker !== "all" && (
                  <div className="flex items-center gap-1.5">
                    <Filter className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-500">Caseworker:</span>
                    <Badge variant="outline" className="text-xs font-normal">
                      {(caseworkerList.find((cw: any) => cw.caseworker === appliedFilters.caseworker) as any)?.display_name || appliedFilters.caseworker}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-500">Points:</span>
                  <span className="font-semibold text-slate-700">{validPoints.length}</span>
                </div>
                {dateRange && (
                  <div className="flex items-center gap-1.5">
                    <Navigation className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-500">Period:</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(dateRange.from).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} &mdash; {new Date(dateRange.to).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[500px] items-center justify-center rounded-lg bg-slate-50">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-slate-500">Loading GPS data...</p>
                </div>
              </div>
            ) : isError ? (
              <div className="flex h-[500px] items-center justify-center rounded-lg bg-red-50">
                <p className="text-sm font-medium text-red-600">Failed to load journey data.</p>
              </div>
            ) : !hasCaseworker ? (
              <div className="flex h-[500px] items-center justify-center rounded-lg bg-slate-50">
                <div className="text-center max-w-md">
                  <MapPin className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">Select a caseworker to view their journey</p>
                  <p className="mt-1 text-xs text-slate-400">Choose a caseworker from the dropdown above, then click Apply.</p>
                </div>
              </div>
            ) : validPoints.length === 0 ? (
              <div className="flex h-[500px] items-center justify-center rounded-lg bg-slate-50">
                <div className="text-center max-w-md">
                  <MapPin className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">No GPS data found for this caseworker</p>
                  <p className="mt-1 text-xs text-slate-400">Try a different date range or caseworker.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Playback controls - above map */}
                {viewMode === "playback" && sortedPoints.length > 0 && (
                  <div className="mb-3 p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <Button size="sm" variant="outline" onClick={() => { setPlaybackIndex(0); setIsPlaying(false); }}>
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={togglePlayback} className={isPlaying ? "bg-red-500 hover:bg-red-600" : ""}>
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setPlaybackIndex(sortedPoints.length - 1); setIsPlaying(false); }}>
                        <SkipForward className="h-4 w-4" />
                      </Button>
                      <div className="flex-1">
                        <input
                          type="range" min={0} max={sortedPoints.length - 1} value={playbackIndex}
                          onChange={(e) => { setPlaybackIndex(Number(e.target.value)); setIsPlaying(false); }}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                      <div className="text-xs text-slate-500 min-w-[100px] text-right">
                        <span className="font-mono font-bold">{playbackIndex + 1}</span> / {sortedPoints.length}
                      </div>
                    </div>
                    {playbackPoint && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>{new Date(playbackPoint.visit_date).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        {(playbackPoint as any).facility && <span className="text-blue-600 font-medium">{(playbackPoint as any).facility}</span>}
                        <span>{playbackPoint.form_type}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="h-[500px] overflow-hidden rounded-lg">
                  <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full" scrollWheelZoom={true}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Journey view */}
                    {viewMode === "journey" && (
                      <>
                        {validPoints.map((point: any, idx: number) => (
                          <CircleMarker key={`j-${idx}`} center={[Number(point.lat), Number(point.lng)]} radius={5}
                            pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.8, weight: 1 }}>
                            <Popup>
                              <div className="text-sm space-y-0.5">
                                <p className="font-semibold">{point.caseworker}</p>
                                {point.facility && <p className="text-blue-600 font-medium">{point.facility}</p>}
                                <p className="text-slate-500">{new Date(point.visit_date).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                                <p className="text-slate-400 text-xs">{point.form_type}</p>
                              </div>
                            </Popup>
                          </CircleMarker>
                        ))}
                        {polylinePositions.length > 1 && (
                          <Polyline positions={polylinePositions} pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.7 }} />
                        )}
                      </>
                    )}

                    {/* Heatmap view */}
                    {viewMode === "heatmap" && <HeatmapLayer points={heatmapData} />}

                    {/* Playback view */}
                    {viewMode === "playback" && (
                      <>
                        {playbackTrail.length > 1 && (
                          <Polyline positions={playbackTrail} pathOptions={{ color: "#10b981", weight: 3, opacity: 0.6 }} />
                        )}
                        {sortedPoints.slice(0, playbackIndex + 1).map((point: any, idx: number) => (
                          <CircleMarker key={`p-${idx}`} center={[Number(point.lat), Number(point.lng)]} radius={3}
                            pathOptions={{ color: "#94a3b8", fillColor: "#94a3b8", fillOpacity: 0.5, weight: 1 }} />
                        ))}
                        {playbackPosition && <PlaybackMarker position={playbackPosition} point={playbackPoint} />}
                      </>
                    )}
                  </MapContainer>
                </div>
              </>
            )}
          </CardContent>
        </GlowCard>
      </div>
    </DashboardLayout>
  );
};

export default CaseworkerJourneys;
