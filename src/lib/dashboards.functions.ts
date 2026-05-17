import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [
      { count: studentCount },
      { count: teacherCount },
      { count: flagsOpen },
      { data: recentFlags },
      { data: school },
    ] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("app_users").select("*", { count: "exact", head: true }).eq("role", "teacher"),
      supabase.from("counselor_flags").select("*", { count: "exact", head: true }).is("resolved_at", null),
      supabase.from("counselor_flags").select("id,reason,severity,created_at,student_id").is("resolved_at", null).order("created_at", { ascending: false }).limit(5),
      supabase.from("schools").select("name,plan,status,trial_expires_at").maybeSingle(),
    ]);
    return {
      studentCount: studentCount ?? 0,
      teacherCount: teacherCount ?? 0,
      flagsOpen: flagsOpen ?? 0,
      recentFlags: recentFlags ?? [],
      school: school ?? null,
    };
  });

export const getTeacherDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [
      { count: observationsCount },
      { data: recentObs },
      { count: unreadMessages },
    ] = await Promise.all([
      supabase.from("observations").select("*", { count: "exact", head: true }).eq("teacher_id", userId),
      supabase.from("observations").select("id,note,subject,tags,created_at,student_id").eq("teacher_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("messages").select("*", { count: "exact", head: true }).eq("to_user_id", userId).is("read_at", null),
    ]);
    return {
      observationsCount: observationsCount ?? 0,
      recentObs: recentObs ?? [],
      unreadMessages: unreadMessages ?? 0,
    };
  });

export const getCounselorDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [
      { count: openFlags },
      { data: flags },
    ] = await Promise.all([
      supabase.from("counselor_flags").select("*", { count: "exact", head: true }).is("resolved_at", null),
      supabase.from("counselor_flags").select("id,reason,severity,created_at,student_id,resolved_at").order("created_at", { ascending: false }).limit(10),
    ]);
    return { openFlags: openFlags ?? 0, flags: flags ?? [] };
  });

export const getParentDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: appUser } = await supabase.from("app_users").select("linked_student_id").maybeSingle();
    const studentId = appUser?.linked_student_id;
    if (!studentId) return { student: null, grades: [], attendance: [], unreadMessages: 0 };
    const [
      { data: student },
      { data: grades },
      { data: attendance },
      { count: unreadMessages },
    ] = await Promise.all([
      supabase.from("students").select("id,full_name,grade,class_id,photo_url").eq("id", studentId).maybeSingle(),
      supabase.from("grades").select("subject,score,max_score,entered_at").eq("student_id", studentId).order("entered_at", { ascending: false }).limit(10),
      supabase.from("attendance").select("date,status").eq("student_id", studentId).order("date", { ascending: false }).limit(14),
      supabase.from("messages").select("*", { count: "exact", head: true }).is("read_at", null),
    ]);
    return { student: student ?? null, grades: grades ?? [], attendance: attendance ?? [], unreadMessages: unreadMessages ?? 0 };
  });

export const getStudentDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: appUser } = await supabase.from("app_users").select("linked_student_id,full_name").maybeSingle();
    const studentId = appUser?.linked_student_id;
    if (!studentId) return { fullName: appUser?.full_name ?? null, grades: [], moodStreak: 0, recentMood: null };
    const [
      { data: grades },
      { data: moods },
    ] = await Promise.all([
      supabase.from("grades").select("subject,score,max_score,entered_at").eq("student_id", studentId).order("entered_at", { ascending: false }).limit(20),
      supabase.from("mood_checkins").select("mood,checked_at").eq("student_id", studentId).order("checked_at", { ascending: false }).limit(14),
    ]);
    return {
      fullName: appUser?.full_name ?? null,
      grades: grades ?? [],
      recentMood: moods?.[0] ?? null,
      moodStreak: moods?.length ?? 0,
    };
  });
