import { trpc } from "@/lib/trpc";

export function useAuth() {
  const { data: user, isLoading, error } = trpc.auth.me.useQuery();
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
