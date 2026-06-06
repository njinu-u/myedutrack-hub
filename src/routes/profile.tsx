import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { deleteOwnAccount } from "@/lib/account.functions";
import { toast } from "sonner";
import { Camera, Loader2, ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — EduTrack" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteFn = useServerFn(deleteOwnAccount);

  const onDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteFn();
      await supabase.auth.signOut();
      toast.success("Account deleted");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deletion failed");
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!auth.loading && !auth.isAuthed) {
      navigate({ to: "/login" });
    }
  }, [auth.loading, auth.isAuthed, navigate]);

  useEffect(() => {
    if (auth.appUser) {
      setFullName(auth.appUser.full_name ?? "");
      setPhone(auth.appUser.phone_number ?? "");
    }
  }, [auth.appUser]);

  if (auth.loading || !auth.appUser) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = auth.appUser.full_name
    ? auth.appUser.full_name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join("")
    : (auth.appUser.email[0] ?? "U").toUpperCase();

  const portalHome = (() => {
    switch (auth.appUser.role) {
      case "school_admin": return "/admin";
      case "teacher": return "/teacher";
      case "counselor": return "/counselor";
      case "parent": return "/parent";
      case "student": return "/student";
      default: return "/";
    }
  })();

  const onPickFile = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${auth.user!.id}/profile.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${pub.publicUrl}?v=${Date.now()}`;
      const { error: updErr } = await supabase
        .from("app_users")
        .update({ avatar_url: url })
        .eq("id", auth.user!.id);
      if (updErr) throw updErr;
      await auth.refreshAppUser();
      toast.success("Profile photo updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("app_users")
        .update({ full_name: fullName.trim() || null, phone_number: phone.trim() || null })
        .eq("id", auth.user!.id);
      if (error) throw error;
      await auth.refreshAppUser();
      toast.success("Profile saved");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to={portalHome} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <h1 className="text-3xl font-display tracking-tight mb-2">Your profile</h1>
        <p className="text-muted-foreground mb-8">Update your photo and personal information.</p>

        <div className="rounded-2xl bg-card border border-border/70 shadow-soft p-6">
          <div className="flex items-center gap-5 mb-8">
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-gradient-to-br from-navy to-teal grid place-items-center text-white text-2xl font-semibold">
                {auth.appUser.avatar_url ? (
                  <img src={auth.appUser.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <button
                onClick={onPickFile}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-md hover:opacity-90 disabled:opacity-60"
                aria-label="Change photo"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
            </div>
            <div>
              <div className="font-medium">{auth.appUser.full_name ?? auth.appUser.email}</div>
              <div className="text-sm text-muted-foreground capitalize">{auth.appUser.role.replace("_", " ")}</div>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Full name">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                placeholder="Your name"
              />
            </Field>
            <Field label="Email" hint="Managed by your sign-in account">
              <input value={auth.appUser.email} disabled className="w-full h-10 px-3 rounded-lg border border-input bg-muted/50 text-muted-foreground" />
            </Field>
            <Field label="Role" hint="Assigned by your school admin">
              <input value={auth.appUser.role.replace("_", " ")} disabled className="w-full h-10 px-3 rounded-lg border border-input bg-muted/50 text-muted-foreground capitalize" />
            </Field>
            <Field label="Phone number">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                placeholder="+1 555 123 4567"
              />
            </Field>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onSave}
              disabled={saving}
              className="h-10 px-5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </label>
  );
}
