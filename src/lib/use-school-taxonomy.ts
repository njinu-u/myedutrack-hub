import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTaxonomy } from "./taxonomy.functions";
import { useAuth } from "./auth";

const COLOR_SECTIONS = ["Red", "Blue", "Green", "Yellow", "Purple", "Orange"];

export function generateSections(style: string, grade: string, count = 3): string[] {
  switch (style) {
    case "alphabet": return Array.from({ length: count }, (_, i) => `${grade}${String.fromCharCode(65 + i)}`);
    case "colors": return Array.from({ length: count }, (_, i) => `${grade} ${COLOR_SECTIONS[i % COLOR_SECTIONS.length]}`);
    case "numbers": return Array.from({ length: count }, (_, i) => `${grade}-${i + 1}`);
    default: return [];
  }
}

export type Taxonomy = {
  grades: string[];
  class_style: string;
  class_sections: Record<string, string[]>;
  subjects: string[];
};

export function useSchoolTaxonomy() {
  const auth = useAuth();
  const fetchTaxonomy = useServerFn(getTaxonomy);
  const q = useQuery({
    queryKey: ["school-taxonomy"],
    enabled: auth.isAuthed && !auth.isDemo,
    queryFn: () => fetchTaxonomy(),
  });

  const tax = (q.data?.taxonomy ?? null) as Taxonomy | null;
  const grades = tax?.grades ?? [];
  const subjects = tax?.subjects ?? [];
  const allClasses = grades.flatMap((g) => {
    const custom = tax?.class_sections?.[g];
    if (custom && custom.length) return custom;
    return generateSections(tax?.class_style ?? "alphabet", g);
  });

  return { taxonomy: tax, grades, subjects, allClasses, isLoading: q.isLoading, isReady: !!tax };
}
