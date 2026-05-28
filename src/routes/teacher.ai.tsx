import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { Sparkles, Send } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/teacher/ai")({ component: AIChat });

const SUGGESTIONS = [
  "Which of my students are most at risk this week?",
  "Generate a differentiated lesson plan for my next class — 3 levels.",
  "Write a progress report narrative for a selected student based on live data.",
  "What does the attendance pattern in my class suggest?",
];

const REPLY = "I can help analyze your live class data once student grades, attendance, observations, and wellbeing signals are available for your school.";

function AIChat() {
  const auth = useAuth();
  const teacherName = auth.appUser?.full_name?.trim() || "there";
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
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
            {[{ role: "ai" as const, text: `Hi ${teacherName}. I'm ready to help with your live class data. Ask me anything.` }, ...messages].map((m, i) => (
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
