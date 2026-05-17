import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TableName = "grades" | "attendance" | "mood_checkins" | "messages" | "counselor_flags" | "observations";

/**
 * Subscribe to realtime changes on the given tables and invalidate the given
 * react-query keys whenever a change is received. RLS scopes events to rows
 * the user can already see, so we don't need extra filters here.
 */
export function useRealtimeInvalidate(tables: TableName[], queryKeys: string[][]) {
  const qc = useQueryClient();
  useEffect(() => {
    const channelName = `rt-${tables.join("-")}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase.channel(channelName);
    for (const table of tables) {
      channel.on(
        // @ts-expect-error postgres_changes typing
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
