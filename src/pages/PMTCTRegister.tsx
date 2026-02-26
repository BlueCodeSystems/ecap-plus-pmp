import { Stethoscope } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import EmptyState from "@/components/EmptyState";
import GlowCard from "@/components/aceternity/GlowCard";

const PMTCTRegister = () => {
  return (
    <DashboardLayout subtitle="PMTCT Register">


      <div className="mt-8">
        <GlowCard className="p-8">
          <EmptyState
            icon={<Stethoscope className="h-12 w-12" />}
            title="PMTCT Module Coming Soon"
            description="The Prevention of Mother-to-Child Transmission (PMTCT) module is under development. It will provide integrated tracking for maternal and infant health services, ensuring seamless clinical follow-up."
          />
        </GlowCard>
      </div>
    </DashboardLayout>
  );
};

export default PMTCTRegister;
