import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { useState } from "react";

export const Route = createFileRoute("/student/mood")({ component: Mood });
const FACES = ["😔","😐","🙂","😊","😄"];
const TAGS = ["Stressed about exams","Tired","Happy","Confused in class","Having fun","Missing home","Friendship issue"];

function Mood() {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="space-y-6">
      <PageHead title="How are you feeling today?" subtitle="60 seconds. Only you and your counselor see the details." />
      <Card>
        <div className="grid grid-cols-5 gap-3">
          {FACES.map((f, i) => (
            <button key={i} onClick={() => setPick(i)} className={`aspect-square text-5xl rounded-2xl border-2 transition ${pick === i ? "border-[oklch(0.65_0.16_145)] bg-[oklch(0.65_0.16_145)]/10 scale-105" : "border-border hover:border-[oklch(0.65_0.16_145)]/50"}`}>{f}</button>
          ))}
        </div>
        {pick !== null && (
          <div className="mt-6">
            <div className="text-sm">Anything specific? (optional)</div>
            <div className="flex flex-wrap gap-2 mt-3">{TAGS.map((t) => <button key={t} className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-[oklch(0.65_0.16_145)]/15">{t}</button>)}</div>
            <button className="mt-5 px-5 py-2.5 rounded-full bg-[oklch(0.5_0.14_160)] text-white text-sm">Save check-in</button>
            <p className="text-xs text-muted-foreground mt-4">Thanks for sharing. It's okay to have hard days. Your wellbeing matters to us. 💚</p>
          </div>
        )}
      </Card>
    </div>
  );
}
