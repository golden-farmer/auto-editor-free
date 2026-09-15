"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { AppProfile } from "@/lib/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: AppProfile | null;
  status: AuthStatus;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const isDevAuthBypass =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
const devProfile: AppProfile = {
  id: "dev-user",
  email: "dev@localhost",
  name: "Dev User",
  image: null,
  company_name: "Dev Company",
  gemini_api_key: null,
  role: "ADMIN",
  status: "APPROVED",
  plan_type: "paid",
  app_access: "both",
  upgraded_at: null,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

const NEW_AUTH_USER_WINDOW_MS = 10 * 60 * 1000;

function isNewAuthUser(createdAt?: string) {
  if (!createdAt) {
    return false;
  }

  const createdAtTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdAtTime)) {
    return false;
  }

  return Date.now() - createdAtTime < NEW_AUTH_USER_WINDOW_MS;
}

function shouldNormalizeSite2Profile(profile: AppProfile, userCreatedAt?: string) {
  return (
    isNewAuthUser(userCreatedAt) &&
    profile.plan_type === "paid" &&
    profile.app_access === "site1"
  );
}

async function upsertAndLoadProfile(user: User) {
  const supabase = createClient();

  let { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<AppProfile>();

  if (!profile && user.email) {
    const { data: createdProfile } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name ?? null,
        image: user.user_metadata?.avatar_url ?? null,
        plan_type: "free",
        app_access: "site2",
        upgraded_at: null,
      })
      .select("*")
      .single<AppProfile>();

    profile = createdProfile;
  }

  if (profile && shouldNormalizeSite2Profile(profile, user.created_at)) {
    const { data: normalizedProfile } = await supabase
      .from("users")
      .update({
        plan_type: "free",
        app_access: "site2",
        upgraded_at: null,
      })
      .eq("id", user.id)
      .select("*")
      .single<AppProfile>();

    profile = normalizedProfile ?? profile;
  }

  return profile ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(
    isDevAuthBypass ? devProfile : null,
  );
  const [status, setStatus] = useState<AuthStatus>(
    isDevAuthBypass ? "authenticated" : "loading",
  );

  const syncSession = async (nextSession: Session | null) => {
    setSession(nextSession);

    if (!nextSession?.user) {
      setUser(null);
      setProfile(null);
      setStatus("unauthenticated");
      return;
    }

    setUser(nextSession.user);
    const nextProfile = await upsertAndLoadProfile(nextSession.user);
    setProfile(nextProfile);
    setStatus("authenticated");
  };

  useEffect(() => {
    if (isDevAuthBypass) {
      return;
    }

    const supabase = createClient();

    void supabase.auth.getSession().then(({ data }) => {
      void syncSession(data.session ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    user,
    profile,
    status,
    refreshProfile: async () => {
      if (isDevAuthBypass) {
        setProfile(devProfile);
        return;
      }

      if (!user) {
        setProfile(null);
        return;
      }

      setProfile(await upsertAndLoadProfile(user));
    },
    signOut: async () => {
      if (isDevAuthBypass) {
        setSession(null);
        setUser(null);
        setProfile(devProfile);
        setStatus("authenticated");
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setStatus("unauthenticated");
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
