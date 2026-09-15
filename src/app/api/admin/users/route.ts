import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedContext } from "@/lib/auth";

const HIDDEN_ADMIN_USER_EMAIL = "yojop0803@gmail.com";

async function requireAdmin() {
  const { profile } = await getAuthenticatedContext();

  if (!profile || profile.role !== "ADMIN") {
    return null;
  }

  return profile;
}

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, created_at, status, role, plan_type, app_access, upgraded_at")
      .neq("email", HIDDEN_ADMIN_USER_EMAIL)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("Failed to fetch users", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, status, role, plan_type, app_access } = body;

    const updates: Record<string, string> = {};
    if (status) updates.status = status;
    if (role) updates.role = role;
    if (plan_type) {
      updates.plan_type = plan_type;
      updates.app_access = app_access ?? (plan_type === "paid" ? "site1" : "site2");
      if (plan_type === "paid") {
        updates.upgraded_at = new Date().toISOString();
      }
    } else if (app_access) {
      updates.app_access = app_access;
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select("id, name, email, created_at, status, role, plan_type, app_access, upgraded_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to update user", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
