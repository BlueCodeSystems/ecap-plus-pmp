import { Mail, ShieldCheck, UserCircle2 } from "lucide-react";
import GlowCard from "@/components/aceternity/GlowCard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const initials = (displayName || user.email || "U")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const roleLabel = typeof user.role === "string" ? user.role : user.role?.name || "N/A";

  return (
    <DashboardLayout subtitle="Profile">
      <PageIntro
        eyebrow="Profile"
        title="Keep your ECAP + identity ready for field work."
        description="Update account details, verify access, and see how your role connects to program delivery."
        actions={<Badge className="bg-emerald-100 text-emerald-700">Directus Account</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlowCard className="p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white text-lg font-semibold">
                {initials}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Account Holder
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {displayName || "N/A"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{user.email}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white/90 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <UserCircle2 className="h-4 w-4 text-primary" />
                  Display Name
                </div>
                <p className="mt-2 text-sm text-slate-600">{displayName || "N/A"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/90 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Mail className="h-4 w-4 text-primary" />
                  Email Address
                </div>
                <p className="mt-2 text-sm text-slate-600">{user.email}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/90 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Role Access
                </div>
                <p className="mt-2 text-sm text-slate-600">{roleLabel}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-sm font-semibold text-amber-800">Access Notes</div>
                <p className="mt-2 text-sm text-amber-700">
                  Your permissions are synced from Directus. Contact an admin if role updates
                  are required.
                </p>
              </div>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Profile Actions</h3>
              <p className="text-sm text-slate-600">
                Keep your account secure and ready for field reporting.
              </p>
            </div>
            <div className="space-y-3">
              <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                Update Contact Details
              </Button>
              <Button variant="outline" className="w-full border-slate-200">
                Reset Password
              </Button>
              <Button variant="outline" className="w-full border-slate-200">
                Request Role Review
              </Button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Recent activity: Profile synced during last login.
            </div>
          </div>
        </GlowCard>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
