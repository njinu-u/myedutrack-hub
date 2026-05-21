import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHead, Card } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users } from "lucide-react";

export const Route = createFileRoute("/teacher/classes")({
  head: () => ({ meta: [{ title: "My Classes — EduTrack" }] }),
  component: Page,
});

type Student = { id: string; full_name: string; grade: string | null; class_id: string | null; photo_url: string | null };

function Page() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;

  const q = useQuery({
    queryKey: ["teacher-classes"],
    enabled: isReal,
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id,full_name,grade,class_id,photo_url").order("class_id").order("full_name");
      if (error) throw new Error(error.message);
      return (data ?? []) as Student[];
    },
  });

  const groups = new Map<string, Student[]>();
  for (const s of q.data ?? []) {
    const k = s.class_id || s.grade || "Unassigned";
    const arr = groups.get(k) ?? [];
    arr.push(s);
    groups.set(k, arr);
  }

  return (
    <div className="space-y-6">
      <PageHead title="My Classes" subtitle="All classes you teach this term." />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in to view your live class roster.</div></Card>}
      {isReal && q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && !q.isLoading && groups.size === 0 && (
        <Card className="text-center py-10">
          <Users className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">No students enrolled. Ask your admin to add students from <span className="font-medium">Admin → Students</span>.</p>
        </Card>
      )}
      {isReal && groups.size > 0 && (
        <div className="space-y-4">
          {[...groups.entries()].map(([k, list]) => (
            <Card key={k}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-xl">Class {k}</h2>
                <span className="text-xs text-muted-foreground">{list.length} students</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {list.map((s) => (
                  <div key={s.id} className="rounded-xl border p-3 text-center">
                    {s.photo_url ? <img src={s.photo_url} alt="" className="h-12 w-12 rounded-full mx-auto object-cover" /> : <div className="h-12 w-12 rounded-full bg-secondary mx-auto grid place-items-center text-sm font-medium">{s.full_name.charAt(0)}</div>}
                    <div className="text-xs font-medium mt-2 truncate">{s.full_name}</div>
                    <div className="text-[10px] text-muted-foreground">{s.grade ?? ""}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
