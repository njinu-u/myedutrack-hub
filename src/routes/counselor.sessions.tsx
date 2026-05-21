import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHead, Card } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, NotebookPen, Plus } from "lucide-react";

export const Route = createFileRoute("/counselor/sessions")({
  head: () => ({ meta: [{ title: "Sessions — EduTrack" }] }),
  component: Page,
});

type Obs = { id: string; student_id: string; subject: string | null; note: string; tags: string[]; created_at: string };
type Student = { id: string; full_name: string };

const THEMES = ["Anxiety", "Family", "Academic", "Peer conflict", "Wellbeing", "Transition"];

function Page() {
  const auth = useAuth();
  const qc = useQueryClient();
  const isReal = auth.isAuthed && !auth.isDemo;
  useRealtimeInvalidate(["observations"], [["counselor-sessions"]]);

  const sessions = useQuery({
    queryKey: ["counselor-sessions"],
    enabled: isReal,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("observations")
        .select("id,student_id,subject,note,tags,created_at")
        .eq("teacher_id", auth.user!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw new Error(error.message);
      return (data ?? []) as Obs[];
    },
  });

  const students = useQuery({
    queryKey: ["counselor-students-min"],
    enabled: isReal,
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id,full_name").order("full_name");
      if (error) throw new Error(error.message);
      return (data ?? []) as Student[];
    },
  });
  const sMap = new Map((students.data ?? []).map((s) => [s.id, s.full_name]));

  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [note, setNote] = useState("");
  const [theme, setTheme] = useState(THEMES[0]);

  const create = useMutation({
    mutationFn: async () => {
      if (!auth.appUser?.school_id) throw new Error("Not signed in");
      if (!studentId) throw new Error("Pick a student");
      if (note.trim().length < 3) throw new Error("Note required");
      const { error } = await supabase.from("observations").insert({
        school_id: auth.appUser.school_id, student_id: studentId, teacher_id: auth.user!.id,
        subject: "Counselor session", note: note.trim(), tags: [theme],
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { toast.success("Session note saved"); setOpen(false); setNote(""); setStudentId(""); qc.invalidateQueries({ queryKey: ["counselor-sessions"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHead title="Session Notes" subtitle="Counselor-only notes per student. Tag themes to surface patterns." actions={
        isReal ? <button onClick={() => setOpen(true)} className="px-3 h-9 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2"><Plus className="h-3.5 w-3.5" /> New session</button> : null
      } />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in as counselor to record sessions.</div></Card>}
      {isReal && sessions.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && !sessions.isLoading && (sessions.data ?? []).length === 0 && (
        <Card className="text-center py-10">
          <NotebookPen className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">No session notes yet. Click <span className="font-medium">New session</span> after your next meeting.</p>
        </Card>
      )}
      {isReal && (sessions.data ?? []).length > 0 && (
        <Card>
          <ul className="space-y-3">
            {(sessions.data ?? []).map((s) => (
              <li key={s.id} className="rounded-xl border p-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-sm">{sMap.get(s.student_id) ?? "Student"}</span>
                  <span className="text-muted-foreground">· {new Date(s.created_at).toLocaleString()}</span>
                  {s.tags?.map((t) => <span key={t} className="px-2 py-0.5 rounded-full bg-secondary">{t}</span>)}
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap">{s.note}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New session note</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Student</span>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm">
                <option value="">Select…</option>
                {(students.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Theme</span>
              <select value={theme} onChange={(e) => setTheme(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm">
                {THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Note</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm resize-none" />
            </label>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-3 py-2 rounded-full bg-secondary text-sm">Cancel</button>
            <button onClick={() => create.mutate()} disabled={create.isPending} className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-50">
              {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save note
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
