import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { Sparkles, Send } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/teacher/ai")({ component: AIChat });

const SUGGESTIONS = [
  "Which of my students are most at risk this week?",
  "Generate a differentiated lesson plan for Grade 7 Math, algebraic expressions — 3 levels.",
  "Write a progress report narrative for Amara based on her data.",
  "What does the attendance pattern in my class suggest?",
];

const REPLY = `Looking at your three classes (7B, 8A, 9A), three students stand out this week:

1. Diego Alvarez (7B) — attendance 65%, Math down 17 points over 4 weeks. URGENT: counselor escalation appropriate.
2. Kofi Mensah (7B) — Math down from 72 → 58 in 5 weeks. Mood trending negative. Recommend early teacher-parent touchpoint.
3. Liam Chen (7B) — attendance 78%, English declining. Note transition support is active; coordinate with counselor.

Want me to draft a parent message for any of them?`;

function AIChat() {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hi Ms. Odhiambo. I'm reading your live class data. Ask me anything." },
  ]);
  const [input, setInput] = useState("");

  const ask = (text: string) => {
    setMessages((m) => [...m, { role: "user", text }, { role: "ai", text: REPLY }]);
    setInput("");
  };

  return (
    <div className="space-y-6">
      <PageHead title="AI Assistant" subtitle="Conversational. Draws on your live student data." />
      <div className="grid lg:grid-cols-4 gap-5">
        <Card className="lg:col-span-3 flex flex-col h-[60vh]">
          <div className="flex-1 overflow-y-auto space-y-3 p-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-navy text-white" : "bg-secondary"}`}>
                  {m.text.split("\n").map((l, j) => <p key={j} className="mb-1 last:mb-0">{l}</p>)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2 items-center border rounded-full pl-4 pr-1.5 py-1.5">
            <Sparkles className="h-4 w-4 text-teal" />
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && input && ask(input)} placeholder="Ask anything…" className="flex-1 bg-transparent outline-none text-sm" />
            <button onClick={() => input && ask(input)} className="h-8 w-8 grid place-items-center rounded-full bg-navy text-white"><Send className="h-3.5 w-3.5" /></button>
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Try asking</div>
          <div className="mt-3 space-y-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="text-left w-full text-xs p-3 rounded-xl bg-secondary/60 hover:bg-secondary transition">{s}</button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
