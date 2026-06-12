import { NextRequest, NextResponse } from "next/server";
import { supabaseAuthServer, supabaseData } from "./supabase-server";
import type { UserProfile } from "./types";

export interface VerifiedUser {
  userId: string;
  email: string;
  profile: UserProfile;
  adminUserId: string;
}

/**
 * Verifies the Bearer token from the Authorization header.
 * Returns the verified user + profile, or a 401 NextResponse.
 */
export async function verifyAuth(
  req: NextRequest
): Promise<{ user: VerifiedUser } | { response: NextResponse }> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  if (!token) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAuthServer.auth.getUser(token);

  if (error || !user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabaseData
    .from("tbl_clientes")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      response: NextResponse.json(
        { error: "User profile not found" },
        { status: 403 }
      ),
    };
  }

  const adminUserId: string = profile.admin_user_id ?? user.id;

  return {
    user: {
      userId: user.id,
      email: user.email ?? "",
      profile: profile as UserProfile,
      adminUserId,
    },
  };
}
