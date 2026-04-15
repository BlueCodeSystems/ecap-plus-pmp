import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Download, Filter, Navigation } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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
import { getCaseworkerJourneys, getCaseworkerList } from "@/lib/api";
import type { JourneyPoint } from "@/lib/api";

// Fix Leaflet default icon issue in bundled environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ZAMBIA_CENTER: [number, number] = [-13.1339, 27.8493];
const DEFAULT_ZOOM = 6;

const CaseworkerJourneys = () => {
  const [selectedCaseworker, setSelectedCaseworker] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [appliedFilters, setAppliedFilters] = useState<{
    caseworker: string;
    from: string;
    to: string;
  }>({ caseworker: "", from: "", to: "" });

  // Fetch caseworker list for the dropdown
  const { data: caseworkerList = [] } = useQuery({
    queryKey: ["caseworker-list"],
    queryFn: getCaseworkerList,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch journey data based on applied filters
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
  });

  // Filter points that have valid GPS coordinates
  const validPoints = useMemo(
    () =>
      journeyPoints.filter(
        (p) =>
          p.lat !== null &&
          p.lng !== null &&
          !isNaN(Number(p.lat)) &&
          !isNaN(Number(p.lng))
      ),
    [journeyPoints]
  );

  // Build polyline positions from valid points (sorted by visit_date)
  const polylinePositions = useMemo(() => {
    const sorted = [...validPoints].sort(
      (a, b) =>
        new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
    );
    return sorted.map(
      (p) => [Number(p.lat), Number(p.lng)] as [number, number]
    );
  }, [validPoints]);

  // Map center: if we have points, center on the first; otherwise Zambia default
  const mapCenter = useMemo<[number, number]>(() => {
    if (polylinePositions.length > 0) return polylinePositions[0];
    return ZAMBIA_CENTER;
  }, [polylinePositions]);

  const mapZoom = polylinePositions.length > 0 ? 10 : DEFAULT_ZOOM;

  // Date range summary
  const dateRange = useMemo(() => {
    if (validPoints.length === 0) return null;
    const dates = validPoints
      .map((p) => p.visit_date)
      .filter(Boolean)
      .sort();
    return { from: dates[0], to: dates[dates.length - 1] };
  }, [validPoints]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      caseworker: selectedCaseworker,
      from: fromDate,
      to: toDate,
    });
  };

  const handleExportCsv = () => {
    if (validPoints.length === 0) return;
    const headers = ["Caseworker", "Visit Date", "Form Type", "Latitude", "Longitude"];
    const rows = validPoints.map((p) => [
      p.caseworker,
      p.visit_date,
      p.form_type,
      p.lat ?? "",
      p.lng ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caseworker-journeys-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout subtitle="Caseworker Journeys">
      <div className="space-y-6">
        <PageIntro
          eyebrow="GPS Tracking"
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
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Caseworker
                </label>
                <Select
                  value={selectedCaseworker}
                  onValueChange={setSelectedCaseworker}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Caseworkers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Caseworkers</SelectItem>
                    {caseworkerList.map((cw) => (
                      <SelectItem key={cw.caseworker} value={cw.caseworker}>
                        {cw.caseworker}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  From
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="min-w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  To
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <Button onClick={handleApplyFilters} className="gap-2">
                <Navigation className="h-4 w-4" />
                Apply
              </Button>

              <Button
                variant="outline"
                onClick={handleExportCsv}
                disabled={validPoints.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </GlowCard>

        {/* Map Card */}
        <GlowCard>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Journey Map
              {validPoints.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {validPoints.length} point{validPoints.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
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
                <div className="text-center">
                  <p className="text-sm font-medium text-red-600">
                    Failed to load journey data. Please try again.
                  </p>
                </div>
              </div>
            ) : validPoints.length === 0 ? (
              <div className="flex h-[500px] items-center justify-center rounded-lg bg-slate-50">
                <div className="text-center max-w-md">
                  <MapPin className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">
                    No GPS data available yet.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    GPS capture needs to be enabled on the mobile app. Once
                    caseworkers submit forms with GPS coordinates, their journeys
                    will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-[500px] overflow-hidden rounded-lg">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  className="h-full w-full"
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {validPoints.map((point, idx) => (
                    <Marker
                      key={`${point.caseworker}-${point.visit_date}-${idx}`}
                      position={[Number(point.lat), Number(point.lng)]}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">{point.caseworker}</p>
                          <p className="text-slate-500">{point.visit_date}</p>
                          <p className="text-slate-500">{point.form_type}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {polylinePositions.length > 1 && (
                    <Polyline
                      positions={polylinePositions}
                      pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.7 }}
                    />
                  )}
                </MapContainer>
              </div>
            )}
          </CardContent>
        </GlowCard>

        {/* Summary */}
        {validPoints.length > 0 && (
          <GlowCard>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Total Points:</span>
                  <span className="font-semibold">{validPoints.length}</span>
                </div>
                {dateRange && (
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Date Range:</span>
                    <span className="font-semibold">
                      {dateRange.from} &mdash; {dateRange.to}
                    </span>
                  </div>
                )}
                {appliedFilters.caseworker &&
                  appliedFilters.caseworker !== "all" && (
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">Caseworker:</span>
                      <Badge variant="outline">
                        {appliedFilters.caseworker}
                      </Badge>
                    </div>
                  )}
              </div>
            </CardContent>
          </GlowCard>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CaseworkerJourneys;
