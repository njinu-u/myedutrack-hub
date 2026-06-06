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

async function getMySchoolId(supabase: { from: (t: string) => { select: (cols: string) => { eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: { school_id: string | null } | null }> } } } }, userId: string): Promise<string | null> {
  const { data } = await supabase.from("app_users").select("school_id").eq("id", userId).maybeSingle();
  return data?.school_id ?? null;
}

export const createStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => StudentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const schoolId = await getMySchoolId(supabase as never, userId);
    if (!schoolId) throw new Error("No school found for current user");
    const { data: row, error } = await supabase
      .from("students")
      .insert({
        full_name: data.full_name?.trim() || "Unnamed Student",
        grade: data.grade ?? null,
        class_id: data.class_id ?? null,
        photo_url: data.photo_url ?? null,
        email: data.email?.trim() || null,
        external_id: data.external_id?.trim() || null,
        custom_fields: data.custom_fields ?? {},
        school_id: schoolId,
      })
      .select("id")
      .single();
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }
    return { id: row.id };
  });

export type BulkImportSummary = {
  added: number;
  updated: number;
  failed: { row: number; reason: string }[];
  parents: { student_id: string; student_name: string; emails: string[] }[];
};

function extractParentEmails(custom: Record<string, unknown> | undefined): string[] {
  if (!custom) return [];
  const out = new Set<string>();
  for (const [k, v] of Object.entries(custom)) {
    const key = k.trim().toLowerCase();
    if (!/parent|guardian|mother|father|\bmom\b|\bdad\b/.test(key)) continue;
    const raw = v == null ? "" : String(v);
    for (const piece of raw.split(/[\s,;]+/)) {
      const e = piece.trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) out.add(e.toLowerCase());
    }
  }
  return Array.from(out);
}

export const bulkCreateStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ rows: z.array(StudentInput).min(1).max(2000) }).parse(input))
  .handler(async ({ data, context }): Promise<BulkImportSummary> => {
    const { supabase, userId } = context;
    const schoolId = await getMySchoolId(supabase as never, userId);
    if (!schoolId) throw new Error("No school found for current user");

    const summary: BulkImportSummary = { added: 0, updated: 0, failed: [], parents: [] };

    const { data: existing } = await supabase
      .from("students")
      .select("id,email,external_id")
      .eq("school_id", schoolId);
    const byEmail = new Map<string, string>();
    const byExt = new Map<string, string>();
    for (const s of existing ?? []) {
      const e = (s as { email?: string | null }).email;
      const x = (s as { external_id?: string | null }).external_id;
      if (e) byEmail.set(e.toLowerCase(), s.id as string);
      if (x) byExt.set(x, s.id as string);
    }

    for (let i = 0; i < data.rows.length; i++) {
      const r = data.rows[i];
      const fullName = r.full_name?.trim() ?? "";
      const email = r.email?.trim() || null;
      const externalId = r.external_id?.trim() || null;

      if (!fullName) {
        summary.failed.push({ row: i + 1, reason: "Missing required field: Full name" });
        continue;
      }

      const existingId =
        (email && byEmail.get(email.toLowerCase())) ||
        (externalId && byExt.get(externalId)) ||
        null;

      const payload = {
        full_name: fullName,
        grade: r.grade ?? null,
        class_id: r.class_id ?? null,
        photo_url: r.photo_url ?? null,
        email,
        external_id: externalId,
        custom_fields: r.custom_fields ?? {},
        school_id: schoolId,
      };

      let savedId: string | null = null;
      if (existingId) {
        const { error } = await supabase.from("students").update(payload).eq("id", existingId).eq("school_id", schoolId);
        if (error) {
          console.error("[server] update failed", error);
          summary.failed.push({ row: i + 1, reason: "Could not update existing record" });
        } else {
          summary.updated += 1;
          savedId = existingId;
        }
      } else {
        const { data: ins, error } = await supabase.from("students").insert(payload).select("id,email,external_id").single();
        if (error) {
          console.error("[server] insert failed", error);
          summary.failed.push({ row: i + 1, reason: "Could not save row" });
        } else {
          summary.added += 1;
          savedId = ins.id as string;
          if (ins.email) byEmail.set((ins.email as string).toLowerCase(), ins.id as string);
          if (ins.external_id) byExt.set(ins.external_id as string, ins.id as string);
        }
      }

      if (savedId) {
        const emails = extractParentEmails(r.custom_fields as Record<string, unknown> | undefined);
        if (emails.length > 0) {
          summary.parents.push({ student_id: savedId, student_name: fullName, emails });
        }
      }
    }

    return summary;
  });

export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("students")
      .select("id,full_name,grade,class_id,photo_url,email,external_id,custom_fields,created_at")
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
