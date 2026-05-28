import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TableName = "grades" | "attendance" | "mood_checkins" | "messages" | "counselor_flags" | "observations";

/**
 * Subscribe to realtime changes on the given tables and invalidate the given
 * react-query keys whenever a change is received. RLS scopes events to rows
 * the user can already see.
 */
export function useRealtimeInvalidate(tables: TableName[], queryKeys: string[][]) {
  const qc = useQueryClient();
  useEffect(() => {
    const channelName = `rt-${tables.join("-")}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase.channel(channelName);
    for (const table of tables) {
      (channel as unknown as { on: (...args: unknown[]) => typeof channel }).on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          for (const key of queryKeys) qc.invalidateQueries({ queryKey: key });
        },
      );
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join(","), queryKeys.map((k) => k.join("/")).join("|")]);
}

export function useMessageRealtimeInvalidate({
  userId,
  schoolId,
  queryKeys,
}: {
  userId?: string | null;
  schoolId?: string | null;
  queryKeys: string[][];
}) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId || !schoolId) return;
    const channelName = `rt-messages-${schoolId}-${userId}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase.channel(channelName);
    const handleChange = (payload: { new?: Record<string, unknown>; old?: Record<string, unknown> }) => {
      const row = payload.new ?? payload.old ?? {};
      if (row.school_id !== schoolId) return;
      if (row.from_user_id !== userId && row.to_user_id !== userId) return;
      for (const key of queryKeys) qc.invalidateQueries({ queryKey: key });
    };

    (channel as unknown as { on: (...args: unknown[]) => typeof channel }).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages", filter: `school_id=eq.${schoolId}` },
      handleChange,
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, schoolId, queryKeys.map((k) => k.join("/")).join("|")]);
}
