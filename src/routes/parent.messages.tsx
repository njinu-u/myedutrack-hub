import { createFileRoute } from "@tanstack/react-router";
import { MessagesView } from "@/components/messages-view";

export const Route = createFileRoute("/parent/messages")({
  component: () => (
    <MessagesView
      title="Communicate"
      subtitle="Stay in touch with your child's teachers — in your language."
      demoBody={
        <div className="text-sm text-muted-foreground">
          Demo preview. Sign in to message your child's real teachers — auto-translation and read receipts will be enabled.
        </div>
      }
    />
  ),
});
