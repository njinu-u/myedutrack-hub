import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CustomFields = z.record(z.string().max(120), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional();

const StudentInput = z.object({
  full_name: z.string().trim().max(200).optional().nullable(),
  grade: z.string().trim().max(50).optional().nullable(),
  class_id: z.string().trim().max(50).optional().nullable(),
  photo_url: z.string().url().max(500).optional().nullable(),
  email: z.string().trim().max(255).optional().nullable(),
  external_id: z.string().trim().max(120).optional().nullable(),
  custom_fields: CustomFields,
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
        full_name: data.full_name?.trim() || "Unnamed Student",
        grade: data.grade ?? null,
        class_id: data.class_id ?? null,
        photo_url: data.photo_url ?? null,
        custom_fields: data.custom_fields ?? {},
        school_id: school.id,
      })
      .select("id")
      .single();
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }
    return { id: row.id };
  });

export const bulkCreateStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ rows: z.array(StudentInput).min(1).max(2000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: school } = await supabase.from("schools").select("id").maybeSingle();
    if (!school) throw new Error("No school found for current user");
    const payload = data.rows.map((r) => ({
      full_name: r.full_name?.trim() || "Unnamed Student",
      grade: r.grade ?? null,
      class_id: r.class_id ?? null,
      photo_url: r.photo_url ?? null,
      custom_fields: r.custom_fields ?? {},
      school_id: school.id,
    }));
    const { error, count } = await supabase.from("students").insert(payload, { count: "exact" });
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }
    return { inserted: count ?? payload.length };
  });

export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("students")
      .select("id,full_name,grade,class_id,photo_url,custom_fields,created_at")
      .order("created_at", { ascending: false });
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }
    return { students: data ?? [] };
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("students").delete().eq("id", data.id);
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }
    return { ok: true as const };
  });
