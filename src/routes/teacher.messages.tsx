import { createFileRoute } from "@tanstack/react-router";
import { MessagesView } from "@/components/messages-view";

export const Route = createFileRoute("/teacher/messages")({
  component: () => (
    <MessagesView
      title="Parent Messages"
      subtitle="Threaded conversations · auto-translated · read receipts."
      demoBody={
        <div className="text-sm text-muted-foreground">
          Demo preview. Sign in to message real parents — threads, AI-suggested replies, and translation will use your school's contacts.
        </div>
      }
    />
  ),
});
