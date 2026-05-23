#!/usr/bin/env bun
/**
 * Regression check: demo data must NEVER appear in real (authed) views.
 *
 * Rule: in any route file under src/routes that contains both a Demo* and
 * a Live* (or LiveXxx) component, mock-data symbols (KOFI, STUDENTS, KPI,
 * AI_INSIGHTS, ATTENDANCE_TREND, PROJECTIONS, SUBJECT_HEATMAP,
 * TODAY_TIMETABLE, PARENT_MESSAGES, SCHOOL_DOTS) may only appear inside
 * Demo* function bodies.
 *
 * Run: bun scripts/check-demo-isolation.mjs
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROUTES = "src/routes";
const MOCK_SYMBOLS = [
  "KOFI", "STUDENTS", "KPI", "AI_INSIGHTS", "ATTENDANCE_TREND",
  "PROJECTIONS", "SUBJECT_HEATMAP", "TODAY_TIMETABLE",
  "PARENT_MESSAGES", "SCHOOL_DOTS",
];

const files = readdirSync(ROUTES).filter((f) => f.endsWith(".tsx")).map((f) => join(ROUTES, f));
const failures = [];

for (const f of files) {
  const src = readFileSync(f, "utf8");
  if (!/@\/lib\/mock-data/.test(src)) continue;
  // Skip public/marketing routes (no Live* component, fully demo by design).
  if (!/function\s+Live[A-Za-z0-9_]*\s*\(/.test(src)) continue;

  // Find spans of Demo* functions; everything outside is "non-demo" code.
  // Cheap heuristic: split by top-level `function ` declarations.
  const lines = src.split("\n");
  const ranges = [];
  let current = null;
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^function\s+([A-Za-z0-9_]+)\s*\(/);
    if (m) {
      if (current) ranges.push(current);
      current = { name: m[1], start: i, end: lines.length - 1 };
      depth = 0;
    }
    if (current) {
      for (const ch of line) {
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth === 0 && i > current.start) {
            current.end = i;
            ranges.push(current);
            current = null;
            break;
          }
        }
      }
    }
  }
  if (current) ranges.push(current);

  for (let i = 0; i < lines.length; i++) {
    for (const sym of MOCK_SYMBOLS) {
      const re = new RegExp(`\\b${sym}\\b`);
      if (!re.test(lines[i])) continue;
      // Allow on import lines
      if (/^\s*import\s/.test(lines[i])) continue;
      const fn = ranges.find((r) => i >= r.start && i <= r.end);
      const inDemo = fn && /^Demo/.test(fn.name);
      if (!inDemo) {
        failures.push(`${f}:${i + 1}  ${sym} used outside Demo* function (in ${fn?.name ?? "module scope"})`);
      }
    }
  }
}

if (failures.length) {
  console.error("✗ Demo-data leak detected:\n");
  for (const msg of failures) console.error("  " + msg);
  console.error(`\n${failures.length} violation(s). Demo symbols must only appear inside Demo* components.`);
  process.exit(1);
}
console.log(`✓ No demo-data leaks across ${files.length} route files.`);
