import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHead, Card } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — EduTrack" }] }),
  component: Page,
});

function Page() {
  const auth = useAuth();
  const qc = useQueryClient();
  const isReal = auth.isAuthed && !auth.isDemo;

  const school = useQuery({
    queryKey: ["school-profile"],
    enabled: isReal,
    queryFn: async () => {
      const { data, error } = await supabase.from("schools").select("id,name,country,admin_email,plan,status,student_count,trial_expires_at").maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  useEffect(() => {
    if (school.data) { setName(school.data.name ?? ""); setCountry(school.data.country ?? ""); }
  }, [school.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!school.data) throw new Error("No school loaded");
      if (!name.trim()) throw new Error("School name is required");
      const { error } = await supabase.from("schools").update({ name: name.trim(), country: country.trim() || null }).eq("id", school.data.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { toast.success("School profile saved"); qc.invalidateQueries({ queryKey: ["school-profile"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHead title="Settings" subtitle="School profile and account information." />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in to manage your school settings.</div></Card>}
      {isReal && school.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && school.data && (
        <>
          <Card>
            <h2 className="font-display text-xl flex items-center gap-2"><SettingsIcon className="h-4 w-4 text-teal" /> School profile</h2>
            <div className="mt-4 space-y-3 max-w-lg">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">School name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Country</span>
                <input value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" />
              </label>
              <button onClick={() => save.mutate()} disabled={save.isPending} className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-50">
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
              </button>
            </div>
          </Card>
          <Card>
            <h2 className="font-display text-xl">Account</h2>
            <dl className="mt-3 grid sm:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Admin email</dt><dd className="mt-1">{school.data.admin_email}</dd></div>
              <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Plan</dt><dd className="mt-1">{school.data.plan}</dd></div>
              <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Status</dt><dd className="mt-1">{school.data.status}</dd></div>
              <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Students</dt><dd className="mt-1">{school.data.student_count ?? 0}</dd></div>
              {school.data.trial_expires_at && <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Trial expires</dt><dd className="mt-1">{new Date(school.data.trial_expires_at).toLocaleDateString()}</dd></div>}
            </dl>
          </Card>
        </>
      )}
    </div>
  );
}
