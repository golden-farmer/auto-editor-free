import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export type AppRole = "USER" | "ADMIN";
export type AppUserStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AppPlanType = "free" | "paid";
export type AppAccess = "site1" | "site2" | "both";

export type AppProfile = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  company_name: string | null;
  gemini_api_key: string | null;
  role: AppRole;
  status: AppUserStatus;
  plan_type: AppPlanType | null;
  app_access: AppAccess | null;
  upgraded_at: string | null;
  created_at: string;
  updated_at: string;
};

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

export async function getAuthenticatedContext() {
  const supabase = await createServerSupabaseClient();

  if (isDevAuthBypass) {
    return { supabase, user: null, profile: devProfile };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null as AppProfile | null };
  }

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

  return {
    supabase,
    user,
    profile: profile ?? null,
  };
}
