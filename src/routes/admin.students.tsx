import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { STUDENTS } from "@/lib/mock-data";
import { Search, Download, MessageSquare, Filter, Upload, Plus, Loader2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { bulkCreateStudents, createStudent, listStudents } from "@/lib/students.functions";
import { createInvitation } from "@/lib/invitations.functions";
import { buildInviteEmail, openGmailCompose, buildInviteUrl } from "@/lib/gmail-compose";
import { toast } from "sonner";
import Papa from "papaparse";

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

type CsvRow = { full_name: string; grade?: string | null; class_id?: string | null; photo_url?: string | null };

function StudentsPage() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;
  const qc = useQueryClient();
  const fetchStudents = useServerFn(listStudents);
  const addStudent = useServerFn(createStudent);
  const bulkAdd = useServerFn(bulkCreateStudents);
  const invite = useServerFn(createInvitation);

  const realQuery = useQuery({
    queryKey: ["admin-students"],
    queryFn: () => fetchStudents(),
    enabled: isReal,
  });

  const [q, setQ] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [csvRows, setCsvRows] = useState<CsvRow[] | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
        // Stagger so the browser opens both tabs reliably
        setTimeout(() => openGmailCompose({ to: payload.invitation.email!, subject, body }), kind === "parent" ? 200 : 1000);
      }
      if (followups.length > 0) {
        toast("Invitations saved. Please send the emails that just opened in Gmail.", { duration: 6000 });
      }
      setAddOpen(false);
      setNewName(""); setNewGrade(""); setNewClass(""); setParentEmail(""); setStudentEmail("");
      qc.invalidateQueries({ queryKey: ["admin-students"] });
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importMut = useMutation({
    mutationFn: () => bulkAdd({ data: { rows: csvRows ?? [] } }),
    onSuccess: (res) => {
      toast.success(`${res.inserted} students imported successfully`);
      setImportOpen(false); setCsvRows(null); setCsvError(null);
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

  const handlePickFile = () => fileRef.current?.click();

  const handleFile = (file: File) => {
    setCsvError(null); setCsvRows(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const fields = (results.meta.fields ?? []).map((f) => f.trim().toLowerCase());
        const nameKey = fields.find((f) => ["name", "full_name", "student", "student_name"].includes(f));
        if (!nameKey) {
          setCsvError("Column 'name' is required but was not found");
          return;
        }
        const rows: CsvRow[] = results.data
          .map((raw): CsvRow | null => {
            const norm: Record<string, string> = {};
            Object.entries(raw).forEach(([k, v]) => { norm[k.trim().toLowerCase()] = (v ?? "").toString().trim(); });
            const full_name = norm[nameKey];
            if (!full_name) return null;
            return {
              full_name,
              grade: norm["grade"] || null,
              class_id: norm["class"] || norm["class_id"] || null,
              photo_url: norm["photo_url"] || norm["photo"] || null,
            };
          })
          .filter((r): r is CsvRow => !!r);
        if (rows.length === 0) {
          setCsvError("No valid rows found in CSV");
          return;
        }
        setCsvRows(rows);
      },
      error: (err) => setCsvError(err.message),
    });
  };

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
              <Upload className="h-3.5 w-3.5" />Import CSV
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
            {isReal ? "No students yet. Use Import CSV or Add student to populate your school." : "No students match your filters."}
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                <tr><th className="text-left py-3 font-medium">Student</th><th className="text-left py-3 font-medium">Grade</th><th className="text-left py-3 font-medium">Class</th><th className="text-left py-3 font-medium">GPA</th><th className="text-left py-3 font-medium">Attendance</th><th className="text-left py-3 font-medium">Status</th></tr>
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

      {/* Import CSV dialog */}
      <Dialog open={importOpen} onOpenChange={(o) => { setImportOpen(o); if (!o) { setCsvRows(null); setCsvError(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import students from CSV</DialogTitle>
            <DialogDescription>Required column: <b>name</b>. Optional: grade, class, photo_url.</DialogDescription>
          </DialogHeader>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          {!csvRows && !csvError && (
            <button onClick={handlePickFile} className="w-full py-10 rounded-xl border-2 border-dashed text-sm hover:border-teal hover:bg-teal/5 transition">
              <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              Choose a .csv file
            </button>
          )}
          {csvError && (
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger flex items-start gap-2">
              <X className="h-4 w-4 shrink-0 mt-0.5" /> {csvError}
            </div>
          )}
          {csvRows && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">Preview · first 5 of {csvRows.length} rows</div>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-secondary"><tr><th className="text-left p-2">Name</th><th className="text-left p-2">Grade</th><th className="text-left p-2">Class</th></tr></thead>
                  <tbody>{csvRows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t"><td className="p-2">{r.full_name}</td><td className="p-2">{r.grade ?? "—"}</td><td className="p-2">{r.class_id ?? "—"}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setImportOpen(false)} className="px-3 py-2 rounded-full bg-secondary text-sm">Cancel</button>
            {csvRows && (
              <button disabled={importMut.isPending} onClick={() => importMut.mutate()}
                className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-50">
                {importMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm import ({csvRows.length})
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
