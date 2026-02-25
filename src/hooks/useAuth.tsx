import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type UserRole = "client" | "professional" | "admin" | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  const inferFallbackRole = (u: User): UserRole => {
    const metaRole = u.user_metadata?.role;
    if (metaRole === "client" || metaRole === "professional" || metaRole === "admin") {
      return metaRole;
    }
    return "client";
  };

  const fetchRole = async (u: User) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.id)
      .limit(1)
      .maybeSingle();

    return (data?.role as UserRole) ?? inferFallbackRole(u);
  };

  useEffect(() => {
    // Get initial session first
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const r = await fetchRole(u);
        setRole(r);
      }
      setLoading(false);
      initializedRef.current = true;
    });

    // Then listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Skip if not yet initialized to avoid race condition
      if (!initializedRef.current) return;
      
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const r = await fetchRole(u);
        setRole(r);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
