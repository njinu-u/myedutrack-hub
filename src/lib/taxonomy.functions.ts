import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TaxonomyInput = z.object({
  grades: z.array(z.string().trim().min(1).max(60)).max(60).default([]),
  class_style: z.enum(["alphabet", "colors", "numbers", "custom"]).default("alphabet"),
  class_sections: z.record(z.string(), z.array(z.string().trim().min(1).max(60)).max(40)).default({}),
  subjects: z.array(z.string().trim().min(1).max(80)).max(100).default([]),
});

export const getTaxonomy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: school } = await supabase.from("schools").select("id").maybeSingle();
    if (!school) return { taxonomy: null };
    const { data, error } = await supabase
      .from("school_taxonomy")
      .select("school_id,grades,class_style,class_sections,subjects")
      .eq("school_id", school.id)
      .maybeSingle();
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }
    return { taxonomy: data };
  });

export const saveTaxonomy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => TaxonomyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: school } = await supabase.from("schools").select("id").maybeSingle();
    if (!school) throw new Error("No school found for current user");
    const { error } = await supabase
      .from("school_taxonomy")
      .upsert({
        school_id: school.id,
        grades: data.grades,
        class_style: data.class_style,
        class_sections: data.class_sections,
        subjects: data.subjects,
      }, { onConflict: "school_id" });
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }
    return { ok: true as const };
  });
