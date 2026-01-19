import { type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import GlowHeader from "@/components/aceternity/GlowHeader";

type DashboardLayoutProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

const DashboardLayout = ({ title, subtitle, children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <main className="flex-1 flex flex-col">
          <GlowHeader>
            <SidebarTrigger />
            <DashboardHeader title={title} subtitle={subtitle} />
          </GlowHeader>

          <div className="flex-1 p-6 space-y-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
