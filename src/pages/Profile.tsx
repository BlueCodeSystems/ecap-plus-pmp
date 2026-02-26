import { Mail, ShieldCheck, UserCircle2, Camera, Upload, Trash2 } from "lucide-react";
import GlowCard from "@/components/aceternity/GlowCard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef } from "react";
import { uploadFile, updateUserAvatar, getFileUrl } from "@/lib/directus";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Profile = () => {
  const { user, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  if (!user) {
    return null;
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    try {
      const uploadedFile = await uploadFile(file);
      await updateUserAvatar(user.id, uploadedFile.id);

      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      queryClient.invalidateQueries({ queryKey: ["users-list-chat"] });

      toast.success("Profile picture updated!");
      await refreshProfile();
    } catch (error) {
      toast.error("Failed to update profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) return;

    setUploading(true);
    try {
      await updateUserAvatar(user.id, null);
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      queryClient.invalidateQueries({ queryKey: ["users-list-chat"] });
      toast.success("Profile picture removed");
      await refreshProfile();
    } catch (error) {
      toast.error("Failed to remove profile picture");
    } finally {
      setUploading(false);
    }
  };

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const initials = (displayName || user.email || "U")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const roleLabel = typeof user.role === "object" ? user.role?.name : user.role || "N/A";
  const avatarUrl = user.avatar ? getFileUrl(user.avatar) : null;

  return (
    <DashboardLayout subtitle="Profile">
      <PageIntro
        eyebrow="Profile"
        title="Keep your ECAP+ identity ready for field work."
        description="Update account details, verify access, and see how your role connects to program delivery."
        actions={<Badge className="bg-emerald-100 text-emerald-700">Directus account</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlowCard className="p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 rounded-2xl border-2 border-slate-100 shadow-md transition-transform duration-300 group-hover:scale-105">
                  <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                  <AvatarFallback className="bg-slate-900 text-white text-2xl font-bold rounded-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.3em] text-slate-500">
                  Account holder
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {displayName || "N/A"}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-slate-600">{user.email}</p>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <p className="text-[10px] font-bold text-primary tracking-wider">{roleLabel}</p>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white/90 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <UserCircle2 className="h-4 w-4 text-primary" />
                  Display name
                </div>
                <p className="mt-2 text-sm text-slate-600">{displayName || "N/A"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/90 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Mail className="h-4 w-4 text-primary" />
                  Email address
                </div>
                <p className="mt-2 text-sm text-slate-600">{user.email}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/90 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Role access
                </div>
                <p className="mt-2 text-sm text-slate-600">{roleLabel}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-sm font-semibold text-amber-800">Access notes</div>
                <p className="mt-2 text-sm text-amber-700">
                  Your permissions are synced from Directus. Contact an admin if role updates
                  are required.
                </p>
              </div>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Manage identity</h3>
              <p className="text-sm text-slate-600">
                Update your profile picture and account security details.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 tracking-wider">Profile picture</h4>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-11"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Updating..." : "Change photo"}
                  </Button>
                  {user.avatar && (
                    <Button
                      variant="outline"
                      className="border-slate-200 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-11"
                      onClick={handleDeleteAvatar}
                      disabled={uploading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="outline" className="w-full border-slate-200 rounded-xl h-11 text-slate-700">
                  Reset password
                </Button>
                <Button variant="ghost" className="w-full text-slate-500 text-xs hover:bg-slate-100 rounded-xl h-10">
                  Request role review
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed">
              <strong>Tip:</strong> Your profile picture is visible to other team members in the support chat and on the organization dashboard.
            </div>
          </div>
        </GlowCard>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
