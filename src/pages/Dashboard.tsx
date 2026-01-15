import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import DataQualityChart from "@/components/dashboard/DataQualityChart";
import ProvincialBreakdown from "@/components/dashboard/ProvincialBreakdown";
import RecentActivity from "@/components/dashboard/RecentActivity";

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4">
            <SidebarTrigger />
            <DashboardHeader />
          </header>
          
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Metrics Grid */}
            <MetricsGrid />
            
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DataQualityChart />
              <ProvincialBreakdown />
            </div>
            
            {/* Recent Activity */}
            <RecentActivity />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
