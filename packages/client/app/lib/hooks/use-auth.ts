import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, authApi, type SessionUser } from "~/lib/api";

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const me = await authApi.me();
      setUser(me);
      setError(null);
    } catch (e) {
      setUser(null);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    error,
    refresh,
    loginUrl: `${API_BASE_URL}/auth/login/google`,
  };
}




