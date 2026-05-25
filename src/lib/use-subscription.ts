import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSubscriptionStatus } from "./subscription.functions";
import { useAuth } from "./auth";

export function useSubscription() {
  const auth = useAuth();
  const fn = useServerFn(getSubscriptionStatus);
  return useQuery({
    queryKey: ["subscription-status"],
    queryFn: () => fn(),
    enabled: auth.isAuthed,
    staleTime: 60_000,
  });
}
