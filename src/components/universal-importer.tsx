import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Upload, X, Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export type FieldDef = {
  key: string;          // canonical field name (e.g. "full_name")
  label: string;        // user-friendly label
  required?: boolean;
};

export type ImportedRow = {
  /** Mapped system fields */
  mapped: Record<string, string | null>;
  /** Unmapped columns preserved as custom fields */
  custom_fields: Record<string, string | null>;
};

export interface UniversalImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldDef[];
  /** Suggested mapping: source-column-lower → field key */
  suggestions?: Record<string, string>;
  onConfirm: (rows: ImportedRow[]) => Promise<void> | void;
  submitting?: boolean;
}

type Step = "upload" | "map" | "preview";
type RawRow = Record<string, string>;

const UNMAPPED = "__unmapped__";
const CUSTOM = "__custom__";

export function UniversalImporter(props: UniversalImporterProps) {
  const { open, onOpenChange, title, description, fields, suggestions = {}, onConfirm, submitting } = props;
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({}); // sourceCol -> field key | UNMAPPED | CUSTOM

  const reset = () => {
    setStep("upload"); setError(null); setColumns([]); setRows([]); setMapping({});
  };

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      let parsedRows: RawRow[] = [];
      let parsedCols: string[] = [];

      if (ext === "json") {
        const text = await file.text();
        const json = JSON.parse(text);
        const arr = Array.isArray(json) ? json : Array.isArray((json as Record<string, unknown>)?.data) ? (json as { data: unknown[] }).data : null;
        if (!arr) throw new Error("JSON must be an array of objects, or { data: [...] }");
        const colSet = new Set<string>();
        parsedRows = arr.map((r) => {
          const row: RawRow = {};
          if (r && typeof r === "object") {
            for (const [k, v] of Object.entries(r as Record<string, unknown>)) {
              colSet.add(k);
              row[k] = v == null ? "" : String(v);
            }
          }
          return row;
        });
        parsedCols = Array.from(colSet);
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "", raw: false });
        parsedRows = json.map((r) => {
          const out: RawRow = {};
          for (const [k, v] of Object.entries(r)) out[k] = v == null ? "" : String(v);
          return out;
        });
        parsedCols = json[0] ? Object.keys(json[0]) : [];
      } else {
        // CSV / TSV / TXT / anything else: papaparse with auto-delimiter
        const text = await file.text();
        const res = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true });
        parsedRows = res.data.map((r) => {
          const out: RawRow = {};
          for (const [k, v] of Object.entries(r)) out[k] = (v ?? "").toString();
          return out;
        });
        parsedCols = (res.meta.fields ?? []).filter(Boolean);
      }

      if (parsedRows.length === 0) {
        setError("No rows detected in file.");
        return;
      }

      // Auto-mapping suggestions
      const initial: Record<string, string> = {};
      for (const col of parsedCols) {
        const lc = col.trim().toLowerCase();
        const suggested = suggestions[lc];
        const direct = fields.find((f) => f.key.toLowerCase() === lc);
        initial[col] = suggested ?? direct?.key ?? CUSTOM;
      }
      setColumns(parsedCols);
      setRows(parsedRows);
      setMapping(initial);
      setStep("map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    }
  };

  const usedKeys = new Set(Object.values(mapping).filter((v) => v !== UNMAPPED && v !== CUSTOM));
  const missingRequired = fields.filter((f) => f.required && !usedKeys.has(f.key));

  const mappedRows: ImportedRow[] = rows.map((r) => {
    const mapped: Record<string, string | null> = {};
    const custom: Record<string, string | null> = {};
    for (const col of columns) {
      const target = mapping[col] ?? CUSTOM;
      const val = (r[col] ?? "").trim();
      if (target === UNMAPPED) continue;
      if (target === CUSTOM) { if (val !== "") custom[col] = val; continue; }
      mapped[target] = val === "" ? null : val;
    }
    return { mapped, custom_fields: custom };
  });

  const handleConfirm = async () => {
    try {
      await onConfirm(mappedRows);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {(["upload", "map", "preview"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full grid place-items-center text-[10px] font-semibold ${step === s ? "bg-navy text-white" : i < ["upload", "map", "preview"].indexOf(step) ? "bg-success/20 text-success" : "bg-secondary"}`}>{i + 1}</span>
              <span className={step === s ? "text-foreground font-medium" : ""}>{s === "upload" ? "Upload" : s === "map" ? "Map columns" : "Preview"}</span>
              {i < 2 && <ArrowRight className="h-3 w-3" />}
            </div>
          ))}
        </div>

        {step === "upload" && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,.txt,.xlsx,.xls,.json,text/csv,application/json,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); if (e.target) e.target.value = ""; }}
            />
            <button onClick={() => fileRef.current?.click()} className="w-full py-12 rounded-xl border-2 border-dashed text-sm hover:border-teal hover:bg-teal/5 transition">
              <Upload className="h-6 w-6 mx-auto mb-3 text-muted-foreground" />
              <div className="font-medium">Choose any file to import</div>
              <div className="text-xs text-muted-foreground mt-1">CSV, XLSX, XLS, JSON, TXT, TSV — your file is accepted as-is.</div>
            </button>
            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger flex items-start gap-2">
                <X className="h-4 w-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}
          </>
        )}

        {step === "map" && (
          <div className="space-y-3 max-h-[55vh] overflow-y-auto">
            <p className="text-xs text-muted-foreground">
              We detected <b>{columns.length}</b> column{columns.length === 1 ? "" : "s"} and <b>{rows.length}</b> row{rows.length === 1 ? "" : "s"}. Match each to a system field, or keep it as a custom field — nothing is discarded.
            </p>
            <div className="rounded-lg border divide-y">
              {columns.map((col) => (
                <div key={col} className="p-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
                  <div className="font-mono text-xs truncate" title={col}>{col || <span className="text-muted-foreground italic">(empty header)</span>}</div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <select
                    value={mapping[col] ?? CUSTOM}
                    onChange={(e) => setMapping((m) => ({ ...m, [col]: e.target.value }))}
                    className="px-3 py-1.5 rounded-lg border bg-card text-sm"
                  >
                    <option value={CUSTOM}>Keep as custom field</option>
                    <option value={UNMAPPED}>Ignore this column</option>
                    <optgroup label="System fields">
                      {fields.map((f) => (
                        <option key={f.key} value={f.key} disabled={Object.entries(mapping).some(([c, v]) => c !== col && v === f.key)}>
                          {f.label}{f.required ? " *" : ""}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              ))}
            </div>
            {missingRequired.length > 0 && (
              <div className="rounded-lg border border-amber/30 bg-amber/5 p-2 text-xs text-amber">
                Required: map a column for {missingRequired.map((f) => f.label).join(", ")}, or rows will be saved with placeholder values.
              </div>
            )}
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-3 max-h-[55vh] overflow-y-auto">
            <p className="text-xs text-muted-foreground">First 5 of {mappedRows.length} rows. Custom fields are preserved alongside system fields.</p>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-secondary">
                  <tr>
                    {fields.filter((f) => usedKeys.has(f.key)).map((f) => (
                      <th key={f.key} className="text-left p-2 whitespace-nowrap">{f.label}</th>
                    ))}
                    {Object.keys(mappedRows[0]?.custom_fields ?? {}).map((k) => (
                      <th key={k} className="text-left p-2 whitespace-nowrap text-teal">{k} <span className="text-muted-foreground">(custom)</span></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mappedRows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t">
                      {fields.filter((f) => usedKeys.has(f.key)).map((f) => (
                        <td key={f.key} className="p-2">{r.mapped[f.key] ?? "—"}</td>
                      ))}
                      {Object.keys(mappedRows[0]?.custom_fields ?? {}).map((k) => (
                        <td key={k} className="p-2 text-muted-foreground">{r.custom_fields[k] ?? "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          <div className="flex w-full justify-between gap-2">
            <div>
              {step !== "upload" && (
                <button onClick={() => setStep(step === "preview" ? "map" : "upload")} className="px-3 py-2 rounded-full bg-secondary text-sm inline-flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => onOpenChange(false)} className="px-3 py-2 rounded-full bg-secondary text-sm">Cancel</button>
              {step === "map" && (
                <button onClick={() => setStep("preview")} className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2">
                  Continue <ArrowRight className="h-3 w-3" />
                </button>
              )}
              {step === "preview" && (
                <button onClick={handleConfirm} disabled={submitting} className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-50">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Confirm import ({mappedRows.length})
                </button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
