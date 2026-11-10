import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useRuntime } from "./runtime";
import { configureProvider } from "./provider-client";

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  recovery: boolean;
  signOut: () => Promise<void>;
}>({ user: null, loading: true, recovery: false, signOut: async () => {} });
export const useAccount = () => useContext(AuthContext);
export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user);
        setLoading(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") setRecovery(false);
      if (["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) {
        void router.invalidate();
        if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [queryClient, router]);
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    // Do not leave decrypted-provider access usable after account sign-out.
    await Promise.all(
      ["openrouter", "huggingface", "custom"].map((provider) =>
        configureProvider(provider as "openrouter" | "huggingface" | "custom", "remove"),
      ),
    );
    useRuntime.setState({ connected: {}, preview: null });
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await router.navigate({ to: "/", replace: true });
  }
  return (
    <AuthContext.Provider value={{ user, loading, recovery, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
