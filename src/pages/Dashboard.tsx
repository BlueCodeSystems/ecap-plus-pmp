import DashboardLayout from "@/components/dashboard/DashboardLayout";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import DataQualityChart from "@/components/dashboard/DataQualityChart";
import ProvincialBreakdown from "@/components/dashboard/ProvincialBreakdown";
import RecentActivity from "@/components/dashboard/RecentActivity";
import PageIntro from "@/components/dashboard/PageIntro";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const Dashboard = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash === "#recent-activity-section") {
      const element = document.getElementById("recent-activity-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [hash]);

  return (
    <DashboardLayout subtitle="Home">
      <PageIntro
        eyebrow="Home"
        title="Bring DQA and program delivery together."
        description="Monitor screening coverage, validate data quality, and coordinate fieldwork without jumping between tools."
        actions={
          <>
            <Badge className="bg-emerald-100 text-emerald-700">Live Monitoring</Badge>
            <Button variant="outline" className="border-slate-200">Start DQA Review</Button>
          </>
        }
      />

      <MetricsGrid />

      <div className="grid grid-cols-1 gap-6">
        <DataQualityChart />
      </div>

      <div id="recent-activity-section">
        <RecentActivity />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
