/**
 * Shared class-label normalization & matching used across grades, attendance,
 * and roster views so teacher-assignment labels match student class_id/grade
 * regardless of formatting ("Year 1C", "Grade 1C", "Class 1C", "1C" all match).
 */
export function normalizeClassLabel(value: string | null | undefined): string {
  if (!value) return "";
  return String(value)
    .toLowerCase()
    .replace(/\b(year|grade|class|form|std|standard)\b/g, "")
    .replace(/[\s\-_.]+/g, "")
    .trim();
}

/** Build a set of normalized labels from teacher/counselor assignments. */
export function buildClassLabelSet(labels: Array<string | null | undefined>): Set<string> {
  const out = new Set<string>();
  for (const l of labels) {
    const n = normalizeClassLabel(l);
    if (n) out.add(n);
  }
  return out;
}

/**
 * True when any of the student's class-identifying fields matches any label
 * in the assignment set. Uses fuzzy substring matching in both directions to
 * tolerate compound labels like "Year 1C" vs "1C".
 */
export function matchesAnyClass(
  candidates: Array<string | null | undefined>,
  assignmentSet: Set<string>,
): boolean {
  if (assignmentSet.size === 0) return true; // no assignments => unrestricted
  const norms = candidates.map(normalizeClassLabel).filter(Boolean);
  if (norms.length === 0) return false;
  for (const c of norms) {
    if (assignmentSet.has(c)) return true;
    for (const a of assignmentSet) {
      if (a && c && (a === c || a.includes(c) || c.includes(a))) return true;
    }
  }
  return false;
}

/** Convenience: candidate fields commonly available on a student row. */
export function studentClassCandidates(s: {
  class_id?: string | null;
  grade?: string | null;
}): string[] {
  return [s.class_id ?? "", s.grade ?? ""].filter(Boolean);
}
