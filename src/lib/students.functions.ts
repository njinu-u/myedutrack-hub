import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const StudentInput = z.object({
  full_name: z.string().trim().min(1).max(200),
  grade: z.string().trim().max(50).optional().nullable(),
  class_id: z.string().trim().max(50).optional().nullable(),
  photo_url: z.string().url().max(500).optional().nullable(),
});

export const createStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => StudentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: school } = await supabase.from("schools").select("id").maybeSingle();
    if (!school) throw new Error("No school found for current user");
    const { data: row, error } = await supabase
      .from("students")
      .insert({
        full_name: data.full_name,
        grade: data.grade ?? null,
        class_id: data.class_id ?? null,
        photo_url: data.photo_url ?? null,
        school_id: school.id,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const bulkCreateStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ rows: z.array(StudentInput).min(1).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: school } = await supabase.from("schools").select("id").maybeSingle();
    if (!school) throw new Error("No school found for current user");
    const payload = data.rows.map((r) => ({
      full_name: r.full_name,
      grade: r.grade ?? null,
      class_id: r.class_id ?? null,
      photo_url: r.photo_url ?? null,
      school_id: school.id,
    }));
    const { error, count } = await supabase.from("students").insert(payload, { count: "exact" });
    if (error) throw new Error(error.message);
    return { inserted: count ?? payload.length };
  });

export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("students")
      .select("id,full_name,grade,class_id,photo_url,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { students: data ?? [] };
  });
