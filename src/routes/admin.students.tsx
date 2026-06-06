import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { STUDENTS } from "@/lib/mock-data";
import { Search, Download, MessageSquare, Filter, Upload, Plus, Loader2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { bulkCreateStudents, createStudent, deleteStudent, listStudents } from "@/lib/students.functions";
import { createInvitation } from "@/lib/invitations.functions";
import { buildInviteEmail, openGmailCompose, buildInviteUrl } from "@/lib/gmail-compose";
import { toast } from "sonner";
import Papa from "papaparse";
import { UniversalImporter, type ImportedRow } from "@/components/universal-importer";

export const Route = createFileRoute("/admin/students")({
  component: StudentsPage,
});

const STATUS_TONES: Record<string, string> = {
  "On Track": "bg-success/15 text-success",
  "Monitor": "bg-amber/15 text-amber",
  "At Risk": "bg-amber/20 text-amber",
  "Critical": "bg-danger/15 text-danger",
  "New Transfer": "bg-teal/15 text-teal",
};

function StudentsPage() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;
  const qc = useQueryClient();
  const fetchStudents = useServerFn(listStudents);
  const addStudent = useServerFn(createStudent);
  const bulkAdd = useServerFn(bulkCreateStudents);
  const invite = useServerFn(createInvitation);
  const removeStudent = useServerFn(deleteStudent);

  const deleteMut = useMutation({
    mutationFn: (id: string) => removeStudent({ data: { id } }),
    onSuccess: () => { toast.success("Student deleted"); qc.invalidateQueries({ queryKey: ["admin-students"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const realQuery = useQuery({
    queryKey: ["admin-students"],
    queryFn: () => fetchStudents(),
    enabled: isReal,
  });

  const [q, setQ] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Add Student form state
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newClass, setNewClass] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [studentEmail, setStudentEmail] = useState("");

  const addMut = useMutation({
    mutationFn: async () => {
      const created = await addStudent({ data: { full_name: newName.trim(), grade: newGrade || null, class_id: newClass || null } });
      const studentId = created.id;
      const followups: Array<{ kind: "parent" | "student"; payload: Awaited<ReturnType<typeof invite>> }> = [];
      if (parentEmail.trim()) {
        const res = await invite({
          data: { role: "parent", name: `Parent of ${newName.trim()}`, email: parentEmail.trim(), linked_student_id: studentId },
        });
        followups.push({ kind: "parent", payload: res });
      }
      if (studentEmail.trim()) {
        const res = await invite({
          data: { role: "student", name: newName.trim(), email: studentEmail.trim(), linked_student_id: studentId },
        });
        followups.push({ kind: "student", payload: res });
      }
      return { followups, studentName: newName.trim() };
    },
    onSuccess: ({ followups, studentName }) => {
      toast.success("Student added");
      for (const { kind, payload } of followups) {
        const url = buildInviteUrl(payload.invitation.token);
        const { subject, body } = buildInviteEmail({
          role: kind,
          recipient_name: kind === "parent" ? "there" : studentName,
          recipient_email: payload.invitation.email!,
          school_name: payload.school_name,
          admin_name: payload.admin_name,
          invite_url: url,
          student_name: studentName,
        });
        setTimeout(() => openGmailCompose({ to: payload.invitation.email!, subject, body }), kind === "parent" ? 200 : 1000);
      }
      if (followups.length > 0) toast("Invitations saved. Please send the emails that just opened in Gmail.", { duration: 6000 });
      setAddOpen(false);
      setNewName(""); setNewGrade(""); setNewClass(""); setParentEmail(""); setStudentEmail("");
      qc.invalidateQueries({ queryKey: ["admin-students"] });
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importMut = useMutation({
    mutationFn: (rows: ImportedRow[]) => bulkAdd({
      data: {
        rows: rows.map((r) => ({
          full_name: r.mapped.full_name ?? null,
          grade: r.mapped.grade ?? null,
          class_id: r.mapped.class_id ?? null,
          photo_url: r.mapped.photo_url ?? null,
          custom_fields: r.custom_fields,
        })),
      },
    }),
    onSuccess: (res) => {
      toast.success(`${res.inserted} students imported successfully`);
      setImportOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const realList = realQuery.data?.students ?? [];
  const display = isReal
    ? realList.map((s) => ({
        id: s.id, name: s.full_name, grade: s.grade ?? "—", classGroup: s.class_id ?? "—",
        nationality: "—", gpa: 0, attendance: 0, status: "On Track",
        joined: new Date(s.created_at).toLocaleDateString(),
        photo: s.photo_url ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.full_name)}`,
      }))
    : STUDENTS.map((s) => ({ ...s }));

  const grades = useMemo(() => Array.from(new Set(display.map((s) => s.grade))).filter(Boolean), [display]);
  const filtered = display.filter((s) => {
    const matchQ = s.name.toLowerCase().includes(q.toLowerCase()) || String(s.grade).toLowerCase().includes(q.toLowerCase());
    const matchGrade = gradeFilter === "all" || s.grade === gradeFilter;
    return matchQ && matchGrade;
  });

  const handleExport = () => {
    const csv = Papa.unparse(display.map((s) => ({
      name: s.name, grade: s.grade, class: s.classGroup, joined: s.joined,
    })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `students-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  };

  const onImportClick = () => {
    if (!isReal) { toast.info("Sign in to import students into your school."); return; }
    setImportOpen(true);
  };
  const onAddClick = () => {
    if (!isReal) { toast.info("Sign in to add students to your school."); return; }
    setAddOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="Students"
        subtitle={isReal ? `${realList.length} students in your school.` : "482 students across Grades 6–10. Filter, message families, generate reports in bulk."}
        actions={
          <>
            <button onClick={onImportClick} className="px-3 h-9 rounded-full bg-secondary text-sm inline-flex items-center gap-2">
              <Upload className="h-3.5 w-3.5" />Import file
            </button>
            <button onClick={onAddClick} className="px-3 h-9 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" />Add student
            </button>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 h-10 rounded-full bg-secondary flex-1 min-w-64">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, grade, nationality…" className="bg-transparent outline-none text-sm flex-1" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 h-10 rounded-full border text-sm">
            <Filter className="h-3.5 w-3.5" />
            <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="bg-transparent outline-none text-sm">
              <option value="all">All grades</option>
              {grades.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <button onClick={handleExport} className="px-3 h-10 rounded-full border text-sm inline-flex items-center gap-2">
            <Download className="h-3.5 w-3.5" />Export
          </button>
          <button onClick={() => toast.success("Drafted bulk message to parents · review in Communication")} className="px-3 h-10 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5" />Message parents
          </button>
        </div>

        {isReal && realQuery.isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading students…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {isReal ? "No students yet. Use Import file or Add student to populate your school." : "No students match your filters."}
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                <tr><th className="text-left py-3 font-medium">Student</th><th className="text-left py-3 font-medium">Grade</th><th className="text-left py-3 font-medium">Class</th><th className="text-left py-3 font-medium">GPA</th><th className="text-left py-3 font-medium">Attendance</th><th className="text-left py-3 font-medium">Status</th><th className="text-right py-3 font-medium">Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-secondary/40 transition">
                    <td className="py-3"><Link to={isReal ? "/admin/students" : `/admin/students/${s.id}`} className="flex items-center gap-3"><img src={s.photo} className="h-9 w-9 rounded-full object-cover" alt="" /><div><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.classGroup} · joined {s.joined}</div></div></Link></td>
                    <td>{s.grade}</td>
                    <td className="text-muted-foreground">{s.classGroup}</td>
                    <td className="font-medium">{s.gpa ? s.gpa.toFixed(1) : "—"}</td>
                    <td>{s.attendance ? <span className={cn("font-medium", s.attendance < 80 ? "text-danger" : s.attendance < 90 ? "text-amber" : "text-success")}>{s.attendance}%</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td><span className={cn("text-[10px] uppercase tracking-wider px-2 py-1 rounded-full", STATUS_TONES[s.status] ?? "bg-secondary")}>{s.status}</span></td>
                    <td className="text-right">
                      {isReal ? (
                        <button
                          onClick={() => { if (confirm(`Delete ${s.name}? This cannot be undone.`)) deleteMut.mutate(String(s.id)); }}
                          disabled={deleteMut.isPending}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-danger/10 text-muted-foreground hover:text-danger transition disabled:opacity-50"
                          aria-label={`Delete ${s.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add student dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a student</DialogTitle>
            <DialogDescription>Create a single student record in your school.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Full name *</span>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" placeholder="Kofi Mensah" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Grade</span>
                <input value={newGrade} onChange={(e) => setNewGrade(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" placeholder="7" /></label>
              <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Class</span>
                <input value={newClass} onChange={(e) => setNewClass(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" placeholder="7B" /></label>
            </div>
            <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Parent email (optional)</span>
              <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" placeholder="parent@example.com" /></label>
            <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Student email (optional)</span>
              <input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" placeholder="student@example.com" /></label>
            <p className="text-xs text-muted-foreground">If provided, invitations save and open in a Gmail tab for you to send.</p>
          </div>
          <DialogFooter>
            <button onClick={() => setAddOpen(false)} className="px-3 py-2 rounded-full bg-secondary text-sm">Cancel</button>
            <button disabled={addMut.isPending || newName.trim().length < 1} onClick={() => addMut.mutate()}
              className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-50">
              {addMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Add student
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Universal Importer */}
      <UniversalImporter
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import students"
        description="Upload any file (CSV, Excel, JSON, TXT). Match its columns to system fields — anything unmatched is preserved as a custom field."
        fields={[
          { key: "full_name", label: "Full name", required: true },
          { key: "grade", label: "Grade" },
          { key: "class_id", label: "Class" },
          { key: "photo_url", label: "Photo URL" },
        ]}
        suggestions={{
          "name": "full_name", "full name": "full_name", "student": "full_name", "student_name": "full_name", "student name": "full_name",
          "grade": "grade", "year": "grade", "form": "grade",
          "class": "class_id", "class_id": "class_id", "section": "class_id",
          "photo": "photo_url", "photo_url": "photo_url", "image": "photo_url",
        }}
        submitting={importMut.isPending}
        onConfirm={async (rows) => { await importMut.mutateAsync(rows); }}
      />
    </div>
  );
}
