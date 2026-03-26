import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EmbeddedDashboard from "@/components/dashboard/EmbeddedDashboard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Dashboard IDs are set via environment variables so they can differ
 * between staging and production without a code change.
 */
const DASHBOARDS = [
  {
    key: "main",
    label: "Program Overview",
    id: import.meta.env.VITE_SUPERSET_DASHBOARD_ID_1 as string,
  },
  {
    key: "services",
    label: "Services",
    id: import.meta.env.VITE_SUPERSET_DASHBOARD_ID_2 as string,
  },
  {
    key: "performance",
    label: "Performance",
    id: import.meta.env.VITE_SUPERSET_DASHBOARD_ID_3 as string,
  },
].filter((d) => d.id); // only show tabs whose env var is set

const Charts = () => {
  const [activeTab, setActiveTab] = useState(DASHBOARDS[0]?.key ?? "main");
  const activeDashboard = DASHBOARDS.find((d) => d.key === activeTab);

  return (
    <DashboardLayout subtitle="Charts">
      <div className="space-y-4">
        {/* Tab selector – only rendered when more than one dashboard is configured */}
        {DASHBOARDS.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {DASHBOARDS.map((d) => (
              <Button
                key={d.key}
                variant={activeTab === d.key ? "default" : "outline"}
                size="sm"
                className={cn(
                  "transition-colors",
                  activeTab === d.key && "shadow-sm",
                )}
                onClick={() => setActiveTab(d.key)}
              >
                {d.label}
              </Button>
            ))}
          </div>
        )}

        {/* Embedded dashboard */}
        {activeDashboard ? (
          <EmbeddedDashboard
            key={activeDashboard.key}
            dashboardId={activeDashboard.id}
            title={activeDashboard.label}
          />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">
            <p className="text-lg font-medium">No dashboards configured</p>
            <p className="mt-1 text-sm">
              Set <code>VITE_SUPERSET_DASHBOARD_ID_1</code> (and optionally _2,
              _3) in your environment variables, then restart the dev server.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Charts;
