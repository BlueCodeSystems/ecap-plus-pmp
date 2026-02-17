import { useState, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { uploadFile, updateUserAvatar } from "@/lib/directus";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ProfilePictureModalProps {
  userId: string;
  currentAvatarUrl?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfilePictureModal = ({
  userId,
  currentAvatarUrl,
  open,
  onOpenChange,
}: ProfilePictureModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const uploadedFile = await uploadFile(selectedFile);
      await updateUserAvatar(userId, uploadedFile.id);

      queryClient.invalidateQueries({ queryKey: ["users-list-chat"] });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });

      toast.success("Profile picture updated!");
      onOpenChange(false);
      setSelectedFile(null);
      setPreview(null);
    } catch (error) {
      toast.error("Failed to upload profile picture");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center">
            {preview || currentAvatarUrl ? (
              <div className="relative">
                <img
                  src={preview || currentAvatarUrl}
                  alt="Profile"
                  className="w-40 h-40 rounded-full object-cover border-4 border-slate-200"
                />
                {preview && (
                  <button
                    onClick={() => {
                      setPreview(null);
                      setSelectedFile(null);
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="w-40 h-40 rounded-full bg-slate-100 flex items-center justify-center">
                <Camera className="h-12 w-12 text-slate-400" />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Photo
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? "Uploading..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
