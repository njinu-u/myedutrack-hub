import { useState } from "react";
import { Card, PageHead } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSchoolUsers, listThread, sendMessage } from "@/lib/messages.functions";
import { useMessageRealtimeInvalidate } from "@/lib/use-realtime";
import { toast } from "sonner";
import { Send, Loader2, MessageSquare } from "lucide-react";

export function MessagesView({ title, subtitle, demoBody }: { title: string; subtitle: string; demoBody: React.ReactNode }) {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;
  if (!isReal) {
    return (
      <div className="space-y-6">
        <PageHead title={title} subtitle={subtitle} />
        <Card>{demoBody}</Card>
      </div>
    );
  }
  return <RealMessages title={title} subtitle={subtitle} />;
}

function RealMessages({ title, subtitle }: { title: string; subtitle: string }) {
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listSchoolUsers);
  const fetchThread = useServerFn(listThread);
  const send = useServerFn(sendMessage);
  const [to, setTo] = useState<string | null>(null);
  const [body, setBody] = useState("");

  useMessageRealtimeInvalidate({
    userId: auth.user?.id,
    schoolId: auth.appUser?.school_id,
    queryKeys: [["msg-thread", to ?? ""], ["msg-users"], ["parent-dash"], ["teacher-dash"]],
  });

  const users = useQuery({ queryKey: ["msg-users"], queryFn: () => fetchUsers() });
  const thread = useQuery({
    queryKey: ["msg-thread", to],
    queryFn: () => fetchThread({ data: { counterpart_id: to! } }),
    enabled: !!to,
  });

  const sendMut = useMutation({
    mutationFn: () => send({ data: { to_user_id: to!, body: body.trim() } }),
    onSuccess: () => {
      setBody("");
      toast.success("Message sent");
      qc.invalidateQueries({ queryKey: ["msg-thread", to] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = users.data?.users ?? [];

  return (
    <div className="space-y-6">
      <PageHead title={title} subtitle={subtitle} />
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1">
          <h3 className="font-display text-lg mb-3">Contacts</h3>
          {users.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : list.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
              No contacts are available yet.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {list.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => setTo(u.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary ${to === u.id ? "bg-secondary" : ""}`}
                  >
                    <div className="font-medium truncate">{u.full_name ?? u.email}</div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{u.role}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2 flex flex-col min-h-[420px]">
          {!to ? (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
              Select a contact to start a conversation.
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {thread.isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading thread…</div>
                ) : (thread.data?.messages.length ?? 0) === 0 ? (
                  <div className="text-sm text-muted-foreground py-12 text-center">
                    No messages yet. Send the first one below.
                  </div>
                ) : (
                  thread.data!.messages.map((m) => {
                    const mine = m.from_user_id !== to;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${mine ? "bg-navy text-white" : "bg-secondary"}`}>
                          <div className="whitespace-pre-wrap break-words">{m.body}</div>
                          <div className={`text-[10px] mt-1 ${mine ? "text-white/60" : "text-muted-foreground"}`}>
                            {new Date(m.sent_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); if (body.trim()) sendMut.mutate(); }}
                className="mt-3 flex gap-2 border-t pt-3"
              >
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 px-3 py-2 rounded-full border bg-card text-sm"
                />
                <button
                  type="submit"
                  disabled={sendMut.isPending || !body.trim()}
                  className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex gap-2 items-center disabled:opacity-50"
                >
                  {sendMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Send
                </button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
