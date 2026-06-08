import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { STUDENTS } from "@/lib/mock-data";
import { Search, Download, MessageSquare, Filter, Upload, Plus, Loader2, Trash2, Mail, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { bulkCreateStudents, createStudent, deleteStudent, listStudents, updateStudent } from "@/lib/students.functions";
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
  const editStudent = useServerFn(updateStudent);

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
  const [inviteFor, setInviteFor] = useState<{ id: string; name: string } | null>(null);
  const [inviteEmails, setInviteEmails] = useState("");

  // Edit student state
  const [editFor, setEditFor] = useState<{ id: string; full_name: string; grade: string; class_id: string; email: string } | null>(null);
  const [editParentEmails, setEditParentEmails] = useState("");

  const editMut = useMutation({
    mutationFn: async () => {
      if (!editFor) throw new Error("No student selected");
      await editStudent({ data: {
        id: editFor.id,
        full_name: editFor.full_name.trim() || undefined,
        grade: editFor.grade.trim() || null,
        class_id: editFor.class_id.trim() || null,
        email: editFor.email.trim() || null,
      } });
      const parentEmails = editParentEmails.split(/[\s,;]+/).map((e) => e.trim()).filter((e) => e.includes("@"));
      const sent: Awaited<ReturnType<typeof invite>>[] = [];
      for (const pe of parentEmails) {
        try {
          const res = await invite({ data: { role: "parent", name: `Parent of ${editFor.full_name}`, email: pe, linked_student_id: editFor.id } });
          sent.push(res);
        } catch (err) { console.error("parent invite failed", pe, err); toast.error(`Could not invite ${pe}`); }
      }
      return { sent, name: editFor.full_name };
    },
    onSuccess: ({ sent, name }) => {
      toast.success("Student updated");
      sent.forEach((payload, idx) => {
        const url = buildInviteUrl(payload.invitation.token);
        const { subject, body } = buildInviteEmail({
          role: "parent", recipient_name: "there", recipient_email: payload.invitation.email!,
          school_name: payload.school_name, admin_name: payload.admin_name, invite_url: url, student_name: name,
        });
        setTimeout(() => openGmailCompose({ to: payload.invitation.email!, subject, body }), 300 + idx * 800);
      });
      if (sent.length > 0) toast(`${sent.length} parent invitation${sent.length>1?"s":""} saved. Gmail tabs will open.`, { duration: 6000 });
      setEditFor(null); setEditParentEmails("");
      qc.invalidateQueries({ queryKey: ["admin-students"] });
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inviteMut = useMutation({
    mutationFn: async () => {
      if (!inviteFor) return { sent: [] as Awaited<ReturnType<typeof invite>>[] };
      const emails = inviteEmails.split(/[\s,;]+/).map((e) => e.trim()).filter((e) => e.includes("@"));
      if (emails.length === 0) throw new Error("Add at least one email");
      const results: Awaited<ReturnType<typeof invite>>[] = [];
      for (const em of emails) {
        try {
          const res = await invite({
            data: { role: "parent", name: `Parent of ${inviteFor.name}`, email: em, linked_student_id: inviteFor.id },
          });
          results.push(res);
        } catch (err) {
          console.error("invite failed", em, err);
          toast.error(`Could not invite ${em}`);
        }
      }
      return { sent: results };
    },
    onSuccess: ({ sent }) => {
      if (sent.length === 0) return;
      sent.forEach((payload, idx) => {
        const url = buildInviteUrl(payload.invitation.token);
        const { subject, body } = buildInviteEmail({
          role: "parent",
          recipient_name: "there",
          recipient_email: payload.invitation.email!,
          school_name: payload.school_name,
          admin_name: payload.admin_name,
          invite_url: url,
          student_name: inviteFor?.name,
        });
        setTimeout(() => openGmailCompose({ to: payload.invitation.email!, subject, body }), 300 + idx * 800);
      });
      toast.success(`${sent.length} parent invitation${sent.length>1?"s":""} saved. Sending emails open in Gmail.`);
      setInviteFor(null);
      setInviteEmails("");
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addMut = useMutation({
    mutationFn: async () => {
      const created = await addStudent({ data: { full_name: newName.trim(), grade: newGrade || null, class_id: newClass || null } });
      const studentId = created.id;
      const followups: Array<{ kind: "parent" | "student"; payload: Awaited<ReturnType<typeof invite>> }> = [];
      const parentEmails = parentEmail.split(/[\s,;]+/).map((e) => e.trim()).filter((e) => e.includes("@"));
      for (const pe of parentEmails) {
        try {
          const res = await invite({
            data: { role: "parent", name: `Parent of ${newName.trim()}`, email: pe, linked_student_id: studentId },
          });
          followups.push({ kind: "parent", payload: res });
        } catch (err) {
          console.error("parent invite failed", pe, err);
          toast.error(`Could not invite ${pe}`);
        }
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
      followups.forEach(({ kind, payload }, idx) => {
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
        setTimeout(() => openGmailCompose({ to: payload.invitation.email!, subject, body }), 300 + idx * 800);
      });
      if (followups.length > 0) toast(`${followups.length} invitation${followups.length>1?"s":""} saved. Please send the emails opening in Gmail.`, { duration: 6000 });
      setAddOpen(false);
      setNewName(""); setNewGrade(""); setNewClass(""); setParentEmail(""); setStudentEmail("");
      qc.invalidateQueries({ queryKey: ["admin-students"] });
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [importSummary, setImportSummary] = useState<{ added: number; updated: number; failed: { row: number; reason: string }[]; parents: { student_id: string; student_name: string; emails: string[] }[] } | null>(null);

  const importMut = useMutation({
    mutationFn: (rows: ImportedRow[]) => bulkAdd({
      data: {
        rows: rows.map((r) => ({
          full_name: r.mapped.full_name ?? null,
          grade: r.mapped.grade ?? null,
          class_id: r.mapped.class_id ?? null,
          photo_url: r.mapped.photo_url ?? null,
          email: r.mapped.email ?? null,
          external_id: r.mapped.external_id ?? null,
          custom_fields: r.custom_fields,
        })),
      },
    }),
    onSuccess: (res) => {
      setImportSummary(res);
      setImportOpen(false);
      const parentCount = res.parents.reduce((n, p) => n + p.emails.length, 0);
      if (res.added + res.updated > 0) {
        toast.success(`Import complete: ${res.added} added, ${res.updated} updated${res.failed.length ? `, ${res.failed.length} failed` : ""}${parentCount ? ` · ${parentCount} parent email${parentCount>1?"s":""} detected` : ""}`);
      } else if (res.failed.length > 0) {
        toast.error(`Import failed: ${res.failed.length} row${res.failed.length>1?"s":""} could not be saved`);
      }
      qc.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkInviteMut = useMutation({
    mutationFn: async (entries: { student_id: string; student_name: string; emails: string[] }[]) => {
      const payloads: { email: string; student_name: string; res: Awaited<ReturnType<typeof invite>> }[] = [];
      for (const entry of entries) {
        for (const em of entry.emails) {
          try {
            const res = await invite({
              data: { role: "parent", name: `Parent of ${entry.student_name}`, email: em, linked_student_id: entry.student_id },
            });
            payloads.push({ email: em, student_name: entry.student_name, res });
          } catch (err) {
            console.error("bulk invite failed", em, err);
          }
        }
      }
      return payloads;
    },
    onSuccess: (payloads) => {
      if (payloads.length === 0) { toast.error("No invitations could be created"); return; }
      payloads.forEach(({ email, student_name, res }, idx) => {
        const url = buildInviteUrl(res.invitation.token);
        const { subject, body } = buildInviteEmail({
          role: "parent", recipient_name: "there", recipient_email: email,
          school_name: res.school_name, admin_name: res.admin_name, invite_url: url, student_name,
        });
        setTimeout(() => openGmailCompose({ to: email, subject, body }), 300 + idx * 800);
      });
      toast.success(`${payloads.length} parent invitation${payloads.length>1?"s":""} saved. Gmail tabs will open to send.`);
      qc.invalidateQueries({ queryKey: ["invitations"] });
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
        email: s.email ?? "", raw_grade: s.grade ?? "", raw_class: s.class_id ?? "",
      }))
    : STUDENTS.map((s) => ({ ...s, email: "", raw_grade: s.grade, raw_class: s.classGroup }));

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
                {filtered.map((s) => {
                  const openEdit = () => {
                    if (!isReal) return;
                    setEditFor({ id: String(s.id), full_name: s.name, grade: s.raw_grade ?? "", class_id: s.raw_class ?? "", email: s.email ?? "" });
                    setEditParentEmails("");
                  };
                  return (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-secondary/40 transition">
                    <td className="py-3">
                      {isReal ? (
                        <button onClick={openEdit} className="flex items-center gap-3 text-left w-full">
                          <img src={s.photo} className="h-9 w-9 rounded-full object-cover" alt="" />
                          <div><div className="font-medium hover:text-teal transition">{s.name}</div><div className="text-xs text-muted-foreground">{s.classGroup} · joined {s.joined}</div></div>
                        </button>
                      ) : (
                        <Link to={`/admin/students/${s.id}`} className="flex items-center gap-3"><img src={s.photo} className="h-9 w-9 rounded-full object-cover" alt="" /><div><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.classGroup} · joined {s.joined}</div></div></Link>
                      )}
                    </td>
                    <td>{s.grade}</td>
                    <td className="text-muted-foreground">{s.classGroup}</td>
                    <td className="font-medium">{s.gpa ? s.gpa.toFixed(1) : "—"}</td>
                    <td>{s.attendance ? <span className={cn("font-medium", s.attendance < 80 ? "text-danger" : s.attendance < 90 ? "text-amber" : "text-success")}>{s.attendance}%</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td><span className={cn("text-[10px] uppercase tracking-wider px-2 py-1 rounded-full", STATUS_TONES[s.status] ?? "bg-secondary")}>{s.status}</span></td>
                    <td className="text-right">
                      {isReal ? (
                        <div className="inline-flex items-center gap-1">
                          <button onClick={openEdit} className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-navy/10 text-muted-foreground hover:text-navy transition" aria-label={`Edit ${s.name}`} title="Edit student">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setInviteFor({ id: String(s.id), name: s.name })}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-teal/10 text-muted-foreground hover:text-teal transition"
                            aria-label={`Invite parents of ${s.name}`}
                            title="Invite parents"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Delete ${s.name}? This cannot be undone.`)) deleteMut.mutate(String(s.id)); }}
                            disabled={deleteMut.isPending}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-danger/10 text-muted-foreground hover:text-danger transition disabled:opacity-50"
                            aria-label={`Delete ${s.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                  );
                })}
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
            <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Parent email(s) (optional)</span>
              <textarea value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} rows={2} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" placeholder="mom@example.com, dad@example.com" />
              <span className="text-[11px] text-muted-foreground">Separate multiple emails with commas, spaces, or new lines. Each parent gets their own invite.</span>
            </label>
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

      {/* Invite parents dialog (per student) */}
      <Dialog open={!!inviteFor} onOpenChange={(o) => { if (!o) { setInviteFor(null); setInviteEmails(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite parents of {inviteFor?.name}</DialogTitle>
            <DialogDescription>Send invitations to one or more parents/guardians. Each will get their own link.</DialogDescription>
          </DialogHeader>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Parent email(s)</span>
            <textarea
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm"
              placeholder="mom@example.com, dad@example.com, guardian@example.com"
            />
            <span className="text-[11px] text-muted-foreground">Separate multiple emails with commas, spaces, or new lines.</span>
          </label>
          <DialogFooter>
            <button onClick={() => { setInviteFor(null); setInviteEmails(""); }} className="px-3 py-2 rounded-full bg-secondary text-sm">Cancel</button>
            <button
              disabled={inviteMut.isPending || inviteEmails.trim().length < 3}
              onClick={() => inviteMut.mutate()}
              className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              {inviteMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Mail className="h-3.5 w-3.5" />Send invitations
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit student dialog */}
      <Dialog open={!!editFor} onOpenChange={(o) => { if (!o) { setEditFor(null); setEditParentEmails(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit student</DialogTitle>
            <DialogDescription>Update class, contact details, or add parent invitations.</DialogDescription>
          </DialogHeader>
          {editFor && (
            <div className="space-y-3">
              <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Full name</span>
                <input value={editFor.full_name} onChange={(e) => setEditFor({ ...editFor, full_name: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Grade</span>
                  <input value={editFor.grade} onChange={(e) => setEditFor({ ...editFor, grade: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" placeholder="7" /></label>
                <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Class</span>
                  <input value={editFor.class_id} onChange={(e) => setEditFor({ ...editFor, class_id: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" placeholder="7B" /></label>
              </div>
              <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Student email</span>
                <input type="email" value={editFor.email} onChange={(e) => setEditFor({ ...editFor, email: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" placeholder="student@example.com" /></label>
              <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Invite new parent email(s) (optional)</span>
                <textarea value={editParentEmails} onChange={(e) => setEditParentEmails(e.target.value)} rows={2} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" placeholder="mom@example.com, dad@example.com" />
                <span className="text-[11px] text-muted-foreground">Adds parent invitations linked to this student.</span>
              </label>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => { setEditFor(null); setEditParentEmails(""); }} className="px-3 py-2 rounded-full bg-secondary text-sm">Cancel</button>
            <button
              disabled={editMut.isPending || !editFor || editFor.full_name.trim().length < 1}
              onClick={() => editMut.mutate()}
              className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              {editMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>




      <UniversalImporter
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import students"
        description="Upload any file (CSV, Excel, JSON, TXT). Match its columns to system fields — anything unmatched is preserved as a custom field. Existing students (matched by email or student ID) are updated instead of duplicated."
        fields={[
          { key: "full_name", label: "Full name", required: true },
          { key: "email", label: "Email" },
          { key: "external_id", label: "Student ID" },
          { key: "grade", label: "Grade" },
          { key: "class_id", label: "Class" },
          { key: "photo_url", label: "Photo URL" },
        ]}
        suggestions={{
          "name": "full_name", "full name": "full_name", "student": "full_name", "student_name": "full_name", "student name": "full_name",
          "email": "email", "email address": "email", "e-mail": "email",
          "id": "external_id", "student_id": "external_id", "student id": "external_id", "external_id": "external_id", "admission_no": "external_id", "admission no": "external_id",
          "grade": "grade", "year": "grade", "form": "grade",
          "class": "class_id", "class_id": "class_id", "section": "class_id",
          "photo": "photo_url", "photo_url": "photo_url", "image": "photo_url",
        }}
        submitting={importMut.isPending}
        onConfirm={async (rows) => { await importMut.mutateAsync(rows); }}
      />

      {/* Post-import summary */}
      <Dialog open={!!importSummary} onOpenChange={(o) => { if (!o) setImportSummary(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import summary</DialogTitle>
            <DialogDescription>Results from your latest student file import.</DialogDescription>
          </DialogHeader>
          {importSummary && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-success/10 text-success p-3 text-center">
                  <div className="text-2xl font-display">{importSummary.added}</div>
                  <div className="text-xs uppercase tracking-wider">Added</div>
                </div>
                <div className="rounded-xl bg-teal/10 text-teal p-3 text-center">
                  <div className="text-2xl font-display">{importSummary.updated}</div>
                  <div className="text-xs uppercase tracking-wider">Updated</div>
                </div>
                <div className="rounded-xl bg-danger/10 text-danger p-3 text-center">
                  <div className="text-2xl font-display">{importSummary.failed.length}</div>
                  <div className="text-xs uppercase tracking-wider">Failed</div>
                </div>
              </div>
              {importSummary.parents.length > 0 && (
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">Parent emails detected</div>
                      <div className="text-xs text-muted-foreground">
                        {importSummary.parents.reduce((n, p) => n + p.emails.length, 0)} email{importSummary.parents.reduce((n, p) => n + p.emails.length, 0)>1?"s":""} across {importSummary.parents.length} student{importSummary.parents.length>1?"s":""}
                      </div>
                    </div>
                    <button
                      onClick={() => bulkInviteMut.mutate(importSummary.parents)}
                      disabled={bulkInviteMut.isPending}
                      className="px-3 py-2 rounded-full bg-navy text-white text-xs inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      {bulkInviteMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                      Send all invitations
                    </button>
                  </div>
                  <div className="max-h-44 overflow-y-auto text-xs space-y-1">
                    {importSummary.parents.map((p) => (
                      <div key={p.student_id} className="flex items-start justify-between gap-2 border-t pt-1">
                        <span className="font-medium truncate">{p.student_name}</span>
                        <span className="text-muted-foreground text-right">{p.emails.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {importSummary.failed.length > 0 && (
                <div className="rounded-lg border max-h-60 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-secondary sticky top-0">
                      <tr><th className="text-left p-2">Row</th><th className="text-left p-2">Reason</th></tr>
                    </thead>
                    <tbody>
                      {importSummary.failed.map((f) => (
                        <tr key={f.row} className="border-t"><td className="p-2 font-mono">{f.row}</td><td className="p-2 text-muted-foreground">{f.reason}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setImportSummary(null)} className="px-4 py-2 rounded-full bg-navy text-white text-sm">Done</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
