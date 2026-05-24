import { LayoutDashboard, Users, GraduationCap, BarChart3, ClipboardList, CalendarCheck, CalendarRange, BookOpen, MessageSquare, UserCog, FileText, Settings, BookMarked, Heart, Brain, ShieldAlert, FolderHeart, MessageCircle, Calendar, Sparkles, Smile, Target, TrendingUp, GraduationCap as Cap, Ticket } from "lucide-react";
import type { NavItem } from "@/components/portal-layout";

export const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/admin/students", label: "Students", icon: <Users className="h-4 w-4" /> },
  { to: "/admin/grades", label: "Grade Management", icon: <GraduationCap className="h-4 w-4" /> },
  { to: "/admin/analytics", label: "Analytics & AI", icon: <BarChart3 className="h-4 w-4" /> },
  { to: "/admin/assessments", label: "Assessments", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/admin/attendance", label: "Attendance", icon: <CalendarCheck className="h-4 w-4" /> },
  { to: "/admin/timetable", label: "Timetable", icon: <CalendarRange className="h-4 w-4" /> },
  { to: "/admin/curriculum", label: "Curriculum", icon: <BookOpen className="h-4 w-4" /> },
  { to: "/admin/communication", label: "Communication", icon: <MessageSquare className="h-4 w-4" /> },
  { to: "/admin/staff", label: "Staff", icon: <UserCog className="h-4 w-4" /> },
  { to: "/admin/invitations", label: "Invitations", icon: <Ticket className="h-4 w-4" /> },
  { to: "/admin/reports", label: "Reports", icon: <FileText className="h-4 w-4" /> },
  { to: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

export const TEACHER_NAV: NavItem[] = [
  { to: "/teacher", label: "My Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/teacher/classes", label: "My Classes", icon: <Users className="h-4 w-4" /> },
  { to: "/teacher/grades", label: "Grade Entry", icon: <GraduationCap className="h-4 w-4" /> },
  { to: "/teacher/observations", label: "Observations", icon: <BookMarked className="h-4 w-4" /> },
  { to: "/teacher/assessments", label: "Assessments", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/teacher/attendance", label: "Attendance", icon: <CalendarCheck className="h-4 w-4" /> },
  { to: "/teacher/messages", label: "Parent Messages", icon: <MessageSquare className="h-4 w-4" /> },
  { to: "/teacher/reports", label: "Reports", icon: <FileText className="h-4 w-4" /> },
  { to: "/teacher/ai", label: "AI Assistant", icon: <Sparkles className="h-4 w-4" /> },
];

export const COUNSELOR_NAV: NavItem[] = [
  { to: "/counselor", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/counselor/students", label: "My Students", icon: <Users className="h-4 w-4" /> },
  { to: "/counselor/wellbeing", label: "Wellbeing Monitor", icon: <Heart className="h-4 w-4" /> },
  { to: "/counselor/interventions", label: "Intervention Tracker", icon: <ShieldAlert className="h-4 w-4" /> },
  { to: "/counselor/sessions", label: "Session Notes", icon: <FolderHeart className="h-4 w-4" /> },
  { to: "/counselor/risk", label: "AI Risk Reports", icon: <Brain className="h-4 w-4" /> },
];

export const PARENT_NAV: NavItem[] = [
  { to: "/parent", label: "My Child", icon: <Heart className="h-4 w-4" /> },
  { to: "/parent/grades", label: "Grades & Reports", icon: <GraduationCap className="h-4 w-4" /> },
  { to: "/parent/attendance", label: "Attendance", icon: <CalendarCheck className="h-4 w-4" /> },
  { to: "/parent/messages", label: "Communicate", icon: <MessageCircle className="h-4 w-4" /> },
  { to: "/parent/appointments", label: "Appointments", icon: <Calendar className="h-4 w-4" /> },
  { to: "/parent/resources", label: "Resources", icon: <BookOpen className="h-4 w-4" /> },
];

export const STUDENT_NAV: NavItem[] = [
  { to: "/student", label: "My Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/student/grades", label: "My Grades", icon: <Cap className="h-4 w-4" /> },
  { to: "/student/growth", label: "My Growth", icon: <TrendingUp className="h-4 w-4" /> },
  { to: "/student/mood", label: "Mood Check-In", icon: <Smile className="h-4 w-4" /> },
  { to: "/student/goals", label: "Goals", icon: <Target className="h-4 w-4" /> },
  { to: "/student/reports", label: "My Reports", icon: <FileText className="h-4 w-4" /> },
];
