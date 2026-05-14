// Mock data for EduTrack International — all hardcoded for demo purposes.

export type Role = "admin" | "teacher" | "counselor" | "parent" | "student";

export const ROLES: { id: Role; label: string; emoji: string; tint: string; desc: string }[] = [
  { id: "admin", label: "Admin", emoji: "🏫", tint: "admin", desc: "School Management" },
  { id: "teacher", label: "Teacher", emoji: "🧑‍🏫", tint: "teacher", desc: "Classroom & Curriculum" },
  { id: "counselor", label: "Counselor", emoji: "🧑‍⚕️", tint: "counselor", desc: "Wellbeing & Intervention" },
  { id: "parent", label: "Parent", emoji: "👨‍👩‍👧", tint: "parent", desc: "Family Portal" },
  { id: "student", label: "Student", emoji: "👨‍🎓", tint: "student", desc: "My Learning" },
];

export type Status = "On Track" | "Monitor" | "At Risk" | "Critical" | "New Transfer";

export interface Student {
  id: string;
  name: string;
  grade: string;
  classGroup: string;
  nationality: string;
  joined: string;
  gpa: number;
  status: Status;
  attendance: number;
  mood: number; // 1-5
  photo: string;
  parent: string;
  parentLang: string;
  subjects: { name: string; grade: number; trend: "up" | "down" | "flat"; recent: number[] }[];
  flags: string[];
}

const photos = [
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop",
];

export const STUDENTS: Student[] = [
  {
    id: "s1", name: "Kofi Mensah", grade: "Grade 7", classGroup: "7B", nationality: "Ghanaian",
    joined: "Sep 2024", gpa: 3.1, status: "Monitor", attendance: 92, mood: 3, photo: photos[0],
    parent: "Adwoa Mensah", parentLang: "English",
    subjects: [
      { name: "Math", grade: 58, trend: "down", recent: [72, 68, 64, 61, 58] },
      { name: "English", grade: 78, trend: "up", recent: [70, 72, 74, 76, 78] },
      { name: "Science", grade: 84, trend: "up", recent: [75, 78, 80, 82, 84] },
      { name: "History", grade: 72, trend: "flat", recent: [70, 73, 71, 72, 72] },
      { name: "Art", grade: 88, trend: "up", recent: [82, 84, 85, 87, 88] },
      { name: "PE", grade: 90, trend: "flat", recent: [89, 90, 91, 89, 90] },
    ],
    flags: ["Math decline 3 weeks", "Mood trending negative"],
  },
  {
    id: "s2", name: "Amara Okeke", grade: "Grade 8", classGroup: "8A", nationality: "Nigerian",
    joined: "Jan 2023", gpa: 3.8, status: "On Track", attendance: 98, mood: 5, photo: photos[3],
    parent: "Ngozi Okeke", parentLang: "English",
    subjects: [
      { name: "Math", grade: 92, trend: "up", recent: [85, 87, 89, 91, 92] },
      { name: "English", grade: 88, trend: "up", recent: [82, 84, 86, 87, 88] },
      { name: "Science", grade: 94, trend: "up", recent: [88, 90, 91, 93, 94] },
      { name: "History", grade: 86, trend: "flat", recent: [85, 86, 84, 87, 86] },
      { name: "French", grade: 81, trend: "up", recent: [74, 76, 78, 80, 81] },
      { name: "PE", grade: 85, trend: "flat", recent: [84, 86, 85, 84, 85] },
    ],
    flags: [],
  },
  {
    id: "s3", name: "Liam Chen", grade: "Grade 7", classGroup: "7B", nationality: "Singaporean",
    joined: "Mar 2024", gpa: 2.4, status: "At Risk", attendance: 78, mood: 2, photo: photos[5],
    parent: "Mei Chen", parentLang: "Mandarin",
    subjects: [
      { name: "Math", grade: 48, trend: "down", recent: [62, 58, 54, 50, 48] },
      { name: "English", grade: 55, trend: "down", recent: [65, 62, 60, 58, 55] },
      { name: "Science", grade: 62, trend: "flat", recent: [62, 60, 64, 61, 62] },
      { name: "History", grade: 68, trend: "up", recent: [60, 62, 64, 66, 68] },
      { name: "Mandarin", grade: 90, trend: "flat", recent: [88, 90, 89, 91, 90] },
      { name: "PE", grade: 75, trend: "flat", recent: [74, 76, 75, 74, 75] },
    ],
    flags: ["Attendance below 80%", "Math + English decline", "Transition support active"],
  },
  {
    id: "s4", name: "Priya Sharma", grade: "Grade 9", classGroup: "9A", nationality: "Indian",
    joined: "Sep 2022", gpa: 3.9, status: "On Track", attendance: 96, mood: 4, photo: photos[1],
    parent: "Anil Sharma", parentLang: "Hindi",
    subjects: [
      { name: "Math", grade: 95, trend: "up", recent: [90, 92, 93, 94, 95] },
      { name: "English", grade: 89, trend: "flat", recent: [88, 90, 89, 88, 89] },
      { name: "Science", grade: 96, trend: "up", recent: [91, 93, 94, 95, 96] },
      { name: "History", grade: 84, trend: "flat", recent: [82, 85, 83, 85, 84] },
      { name: "Hindi", grade: 92, trend: "flat", recent: [90, 92, 91, 93, 92] },
      { name: "PE", grade: 80, trend: "flat", recent: [78, 80, 81, 79, 80] },
    ],
    flags: [],
  },
  {
    id: "s5", name: "Zara Al-Mansour", grade: "Grade 8", classGroup: "8A", nationality: "Emirati",
    joined: "Sep 2024", gpa: 3.4, status: "New Transfer", attendance: 88, mood: 3, photo: photos[2],
    parent: "Fatima Al-Mansour", parentLang: "Arabic",
    subjects: [
      { name: "Math", grade: 74, trend: "up", recent: [68, 70, 72, 73, 74] },
      { name: "English", grade: 68, trend: "up", recent: [60, 62, 65, 66, 68] },
      { name: "Science", grade: 79, trend: "flat", recent: [78, 80, 79, 78, 79] },
      { name: "History", grade: 82, trend: "up", recent: [76, 78, 80, 81, 82] },
      { name: "Arabic", grade: 95, trend: "flat", recent: [94, 95, 96, 94, 95] },
      { name: "Art", grade: 86, trend: "up", recent: [80, 82, 84, 85, 86] },
    ],
    flags: ["Settling in — 3 months"],
  },
  {
    id: "s6", name: "Diego Alvarez", grade: "Grade 7", classGroup: "7B", nationality: "Mexican",
    joined: "Sep 2023", gpa: 1.9, status: "Critical", attendance: 65, mood: 1, photo: photos[5],
    parent: "Sofia Alvarez", parentLang: "Spanish",
    subjects: [
      { name: "Math", grade: 38, trend: "down", recent: [55, 50, 45, 42, 38] },
      { name: "English", grade: 42, trend: "down", recent: [55, 52, 48, 45, 42] },
      { name: "Science", grade: 48, trend: "down", recent: [60, 56, 54, 50, 48] },
      { name: "History", grade: 55, trend: "flat", recent: [54, 56, 55, 54, 55] },
      { name: "Spanish", grade: 88, trend: "flat", recent: [86, 88, 87, 89, 88] },
      { name: "PE", grade: 70, trend: "flat", recent: [70, 72, 70, 71, 70] },
    ],
    flags: ["URGENT: Counselor intervention", "Attendance critical", "Family liaison needed"],
  },
  {
    id: "s7", name: "Aisha Hassan", grade: "Grade 9", classGroup: "9A", nationality: "Kenyan",
    joined: "Sep 2021", gpa: 3.6, status: "On Track", attendance: 94, mood: 4, photo: photos[3],
    parent: "Nia Hassan", parentLang: "Swahili",
    subjects: [
      { name: "Math", grade: 84, trend: "up", recent: [78, 80, 82, 83, 84] },
      { name: "English", grade: 90, trend: "up", recent: [85, 86, 88, 89, 90] },
      { name: "Science", grade: 88, trend: "flat", recent: [86, 88, 87, 89, 88] },
      { name: "History", grade: 92, trend: "up", recent: [86, 88, 90, 91, 92] },
      { name: "Swahili", grade: 95, trend: "flat", recent: [94, 95, 94, 96, 95] },
      { name: "PE", grade: 82, trend: "flat", recent: [80, 82, 81, 83, 82] },
    ],
    flags: ["Leadership strength noted"],
  },
  {
    id: "s8", name: "James Okonkwo", grade: "Grade 8", classGroup: "8A", nationality: "Nigerian",
    joined: "Sep 2023", gpa: 3.0, status: "Monitor", attendance: 89, mood: 3, photo: photos[5],
    parent: "Chika Okonkwo", parentLang: "English",
    subjects: [
      { name: "Math", grade: 70, trend: "flat", recent: [70, 72, 68, 71, 70] },
      { name: "English", grade: 75, trend: "up", recent: [70, 72, 73, 74, 75] },
      { name: "Science", grade: 65, trend: "down", recent: [72, 70, 68, 66, 65] },
      { name: "History", grade: 78, trend: "up", recent: [72, 74, 76, 77, 78] },
      { name: "French", grade: 68, trend: "flat", recent: [68, 70, 67, 69, 68] },
      { name: "PE", grade: 85, trend: "flat", recent: [84, 86, 85, 84, 85] },
    ],
    flags: ["Science declining"],
  },
];

export const KPI = {
  totalStudents: 482,
  activeTeachers: 38,
  avgAttendance: 91,
  aiAlerts: 12,
  reportsPending: 14,
  outstandingFees: 24800,
};

export const AI_INSIGHTS = [
  { level: "critical" as const, title: "Grade 7 Math: 8 students below threshold", body: "Pattern consistent for 3 weeks. Root cause: shift in topic difficulty + new substitute teacher in 2 sections. Causal analysis available.", time: "2 min ago" },
  { level: "warn" as const, title: "Attendance dip detected on Mondays", body: "Consistent 3 months across Grades 7–9. Possible transport route or motivational pattern. Recommend parent survey.", time: "1 hour ago" },
  { level: "info" as const, title: "After-school math club correlation", body: "Attendees outperforming peers by 23% on Unit 4 assessment. Consider expanding programme.", time: "Today" },
  { level: "good" as const, title: "Ms. Odhiambo — sustained engagement leader", body: "Highest engagement score 3 consecutive months. Worth documenting practice for staff PD.", time: "Yesterday" },
  { level: "warn" as const, title: "Diego Alvarez — escalation recommended", body: "Attendance 65%, mood 1/5, 4 subjects in decline. Counselor flagged for urgent intervention.", time: "3 hours ago" },
];

export const ATTENDANCE_TREND = [
  { week: "W1", rate: 94 }, { week: "W2", rate: 93 }, { week: "W3", rate: 92 },
  { week: "W4", rate: 89 }, { week: "W5", rate: 90 }, { week: "W6", rate: 88 },
  { week: "W7", rate: 91 }, { week: "W8", rate: 91 },
];

export const PROJECTIONS = [
  { name: "Exceed", value: 124, color: "var(--color-success)" },
  { name: "On Track", value: 218, color: "var(--color-teal)" },
  { name: "At Risk", value: 96, color: "var(--color-amber)" },
  { name: "Critical", value: 44, color: "var(--color-danger)" },
];

export const SUBJECT_HEATMAP = [
  { subject: "Math",     g6: 78, g7: 64, g8: 71, g9: 82, g10: 79 },
  { subject: "English",  g6: 82, g7: 80, g8: 84, g9: 88, g10: 85 },
  { subject: "Science",  g6: 80, g7: 78, g8: 82, g9: 86, g10: 84 },
  { subject: "History",  g6: 76, g7: 78, g8: 80, g9: 84, g10: 82 },
  { subject: "Arts",     g6: 88, g7: 86, g8: 84, g9: 86, g10: 88 },
  { subject: "Languages",g6: 84, g7: 82, g8: 80, g9: 82, g10: 80 },
];

export const TODAY_TIMETABLE = [
  { time: "08:00", subject: "Math · 7B", room: "Room 12" },
  { time: "09:30", subject: "Math · 8A", room: "Room 12" },
  { time: "11:00", subject: "Free Period", room: "Staff Room" },
  { time: "13:00", subject: "Math · 9A", room: "Room 14" },
  { time: "14:30", subject: "Math Club", room: "Room 12" },
];

export const PARENT_MESSAGES = [
  { from: "Adwoa Mensah", subject: "Re: Kofi's math homework", time: "10 min ago", unread: true, lang: "English" },
  { from: "Mei Chen", subject: "Liam absence today", time: "2 hr ago", unread: true, lang: "Mandarin → EN" },
  { from: "Sofia Alvarez", subject: "Diego — meeting request", time: "Yesterday", unread: false, lang: "Spanish → EN" },
];

export const SCHOOL_DOTS = [
  { name: "Nairobi", x: 56, y: 60 },
  { name: "Dubai", x: 62, y: 48 },
  { name: "Singapore", x: 78, y: 60 },
  { name: "London", x: 47, y: 32 },
  { name: "Mumbai", x: 68, y: 50 },
  { name: "Lagos", x: 48, y: 56 },
  { name: "Jakarta", x: 80, y: 64 },
];

export function getStudent(id: string) {
  return STUDENTS.find((s) => s.id === id) ?? STUDENTS[0];
}

export const KOFI = STUDENTS[0];
