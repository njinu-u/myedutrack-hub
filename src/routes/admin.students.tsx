import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { STUDENTS } from "@/lib/mock-data";
import { Search, Download, MessageSquare, Filter } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
  const [q, setQ] = useState("");
  const filtered = STUDENTS.filter(s => s.name.toLowerCase().includes(q.toLowerCase()) || s.grade.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-6">
      <PageHead title="Students" subtitle="482 students across Grades 6–10. Filter, message families, generate reports in bulk." />

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 h-10 rounded-full bg-secondary flex-1 min-w-64">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, grade, nationality…" className="bg-transparent outline-none text-sm flex-1" />
          </div>
          <button className="px-3 h-10 rounded-full border text-sm inline-flex items-center gap-2"><Filter className="h-3.5 w-3.5" />Filters</button>
          <button className="px-3 h-10 rounded-full border text-sm inline-flex items-center gap-2"><Download className="h-3.5 w-3.5" />Export</button>
          <button className="px-3 h-10 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5" />Message parents</button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b">
              <tr><th className="text-left py-3 font-medium">Student</th><th className="text-left py-3 font-medium">Grade</th><th className="text-left py-3 font-medium">Nationality</th><th className="text-left py-3 font-medium">GPA</th><th className="text-left py-3 font-medium">Attendance</th><th className="text-left py-3 font-medium">Status</th></tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-secondary/40 transition">
                  <td className="py-3"><Link to={`/admin/students/${s.id}`} className="flex items-center gap-3"><img src={s.photo} className="h-9 w-9 rounded-full object-cover" alt="" /><div><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.classGroup} · joined {s.joined}</div></div></Link></td>
                  <td>{s.grade}</td>
                  <td className="text-muted-foreground">{s.nationality}</td>
                  <td className="font-medium">{s.gpa.toFixed(1)}</td>
                  <td><span className={cn("font-medium", s.attendance < 80 ? "text-danger" : s.attendance < 90 ? "text-amber" : "text-success")}>{s.attendance}%</span></td>
                  <td><span className={cn("text-[10px] uppercase tracking-wider px-2 py-1 rounded-full", STATUS_TONES[s.status])}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
