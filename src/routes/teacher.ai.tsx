import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { askTeacherAI } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/ai")({ component: AIChat });

const SUGGESTIONS = [
  "Which of my students are most at risk this week?",
  "Generate a differentiated lesson plan for my next class — 3 levels.",
  "Write a progress report narrative for a selected student based on live data.",
  "What does the attendance pattern in my class suggest?",
];

type Msg = { role: "user" | "assistant"; text: string };

function AIChat() {
  const auth = useAuth();
  const teacherName = auth.appUser?.full_name?.trim() || "there";
  const ask = useServerFn(askTeacherAI);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const mut = useMutation({
    mutationFn: async (history: Msg[]) => ask({ data: { messages: history } }),
    onSuccess: (res) => {
      setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
      if (res.error) toast.error(res.reply);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setMessages((m) => [...m, { role: "assistant", text: "Something went wrong. Please try again." }]);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, mut.isPending]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || mut.isPending) return;
    const next: Msg[] = [...messages, { role: "user", text: t }];
    setMessages(next);
    setInput("");
    mut.mutate(next);
  };

  return (
    <div className="space-y-6">
      <PageHead title="AI Assistant" subtitle="Conversational. Draws on your live student data." />
      <div className="grid lg:grid-cols-4 gap-5">
        <Card className="lg:col-span-3 flex flex-col h-[60vh]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-2">
            {[{ role: "assistant" as const, text: `Hi ${teacherName}. I'm ready to help with your live class data. Ask me anything.` }, ...messages].map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-navy text-white" : "bg-secondary"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {mut.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 text-sm bg-secondary inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2 items-center border rounded-full pl-4 pr-1.5 py-1.5">
            <Sparkles className="h-4 w-4 text-teal" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Ask anything…"
              disabled={mut.isPending}
              className="flex-1 bg-transparent outline-none text-sm disabled:opacity-60"
            />
            <button
              onClick={() => send(input)}
              disabled={mut.isPending || !input.trim()}
              className="h-8 w-8 grid place-items-center rounded-full bg-navy text-white disabled:opacity-50"
            >
              {mut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Try asking</div>
          <div className="mt-3 space-y-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={mut.isPending}
                className="text-left w-full text-xs p-3 rounded-xl bg-secondary/60 hover:bg-secondary transition disabled:opacity-60"
              >
                {s}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
